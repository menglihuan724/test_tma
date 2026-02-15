import React, { useEffect, useMemo, useState } from "react";
import { Table, Spin, Typography, message, Button, Input, Tag } from "antd";
import type { SortOrder, SorterResult, TablePaginationConfig } from "antd/es/table/interface";
import type { FilterValue } from "antd/es/table/interface";
import { SearchOutlined } from "@ant-design/icons";

type Row = Record<string, any> & { address?: string };
type WindowStat = {
  key: string;
  label: string;
  total: number;
  success: number;
  failure: number;
  revenue_cfx: number;
  revenue_usdt: number;
  is_first_fail: number;
};

const UniLogTable: React.FC = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [filteredRows, setFilteredRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [addressFilter, setAddressFilter] = useState<string>("");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [sortedInfo, setSortedInfo] = useState<SorterResult<Row>>({});

  const parseTs = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') {
      const ts = v > 1e12 ? v : v * 1000;
      return ts + (8 * 60 * 60 * 1000);
    }
    const n = Number(v);
    if (!Number.isNaN(n)) {
      const ts = n > 1e12 ? n : n * 1000;
      return ts + (8 * 60 * 60 * 1000);
    }
    const d = Date.parse(v);
    if (Number.isNaN(d)) return 0;
    return d + (8 * 60 * 60 * 1000);
  };

  const requestAiSummary = async (sourceRows: Row[]) => {
    try {
      setAiLoading(true);
      const now = Date.now();
      const oneHourMs = 24*60 * 60 * 1000;
      const rowsIn1h = sourceRows.filter(r => {
        const ts = parseTs((r as any).create_time ?? (r as any).update_time ?? (r as any).timestamp);
        return ts >= now - oneHourMs;
      });

      const toNum = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      const summary = rowsIn1h.reduce(
        (acc, r) => {
          acc.total += toNum((r as any).total);
          acc.success += toNum((r as any).success);
          acc.failure += toNum((r as any).failure);
          acc.revenue_cfx += toNum((r as any).revenue_cfx);
          acc.revenue_usdt += toNum((r as any).revenue_usdt);
          const firstFailVal = (r as any).is_first_fail;
          acc.is_first_fail += firstFailVal ? 1 : 0;
          return acc;
        },
        { total: 0, success: 0, failure: 0, revenue_cfx: 0, revenue_usdt: 0, is_first_fail: 0 }
      );

      // 选取收益前3地址，避免 prompt 过长
      const topAddresses = [...rowsIn1h]
        .sort((a, b) => toNum((b as any).revenue_usdt) - toNum((a as any).revenue_usdt))
        .slice(0, 3)
        .map(r => ({ address: (r as any).address, revenue_usdt: toNum((r as any).revenue_usdt) }));

      const successRate = summary.total > 0 ? (summary.success / summary.total) * 100 : 0;

      const prompt = `指标：\n- total: ${summary.total}\n- success: ${summary.success}\n- failure: ${summary.failure}\n- success_rate: ${successRate.toFixed(2)}%\n- revenue_cfx: ${summary.revenue_cfx.toFixed(2)}\n- revenue_usdt: ${summary.revenue_usdt.toFixed(2)}\n- is_first_fail_count: ${summary.is_first_fail}\n- top3_by_revenue_usdt: ${topAddresses.map(t => `${t.address || 'N/A'}:${t.revenue_usdt.toFixed(2)}`).join(', ')}`;

      const res = await fetch(`/ai?prompt=${encodeURIComponent(prompt)}`);
      const json = await res.json();

      const extractAiText = (obj: any): string => {
        if (!obj || typeof obj !== 'object') return '';
        if (typeof obj.response === 'string') return obj.response;
        if (typeof obj.output_text === 'string') return obj.output_text;
        if (typeof obj.text === 'string') return obj.text;
        const outputArr = obj.output;
        if (Array.isArray(outputArr)) {
          const first = outputArr[1];
          const content = first?.content;
          if (Array.isArray(content) && typeof content[0]?.text === 'string') return content[0].text;
          if (typeof first?.text === 'string') return first.text;
        }
        const resultResp = obj.result?.response;
        if (typeof resultResp === 'string') return resultResp;
        const choices = obj.choices;
        if (Array.isArray(choices)) {
          const candidate = choices[0]?.message?.content ?? choices[0]?.delta?.content ?? choices[0]?.text;
          if (typeof candidate === 'string') return candidate;
        }
        return '';
      };

      const text = extractAiText(json);
      setAiSummary(text || '');
    } catch (e: any) {
      setAiSummary('AI 总结生成失败');
    } finally {
      setAiLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/log");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      const data: Row[] = json?.data || [];
      setRows(data);
      setFilteredRows(data);
      requestAiSummary(data);
    } catch (e: any) {
      message.error(e?.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 地址筛选
  useEffect(() => {
    if (!addressFilter.trim()) {
      setFilteredRows(rows);
    } else {
      const filtered = rows.filter(row => 
        row.address && row.address.toLowerCase().includes(addressFilter.toLowerCase())
      );
      setFilteredRows(filtered);
    }
  }, [rows, addressFilter]);

  // 计算汇总数据
  const summaryData = useMemo(() => {
    const columnSums: Record<string, number> = {};
    
    // 遍历所有列，计算数值列的总和
    const fieldSet = new Set<string>();
    filteredRows.forEach((r) => Object.keys(r).forEach((k) => fieldSet.add(k)));
    
    Array.from(fieldSet).forEach(key => {
      const isNotSort = ['address', 'create_time', 'update_time'].some(field => 
        key.toLowerCase().includes(field)
      );
        if(!isNotSort){
          columnSums[key] = filteredRows.reduce((sum, row) => {
            const value = parseFloat(row[key] || 0);
            return sum + value;
          }, 0);
        }
      
    });
    
    return columnSums;
  }, [filteredRows]);

  const columns = useMemo(() => {
    // 使用 filteredRows 来生成列定义，确保与显示数据一致
    const fieldSet = new Set<string>();
    filteredRows.forEach((r) => Object.keys(r).forEach((k) => fieldSet.add(k)));
    // 同时也检查 rows，确保新加载的数据字段不丢失
    rows.forEach((r) => Object.keys(r).forEach((k) => fieldSet.add(k)));
    const keys = Array.from(fieldSet);
    
    return keys.map((key) => {
      const isAddressField = ['address'].some(field => 
        key.toLowerCase().includes(field)
      );
      const isCreateTime = key.toLowerCase().includes('create_time');
      
      // 创建持久化的 sorter 函数，避免每次渲染创建新函数
      const handleSorter = isCreateTime
        ? (a: Row, b: Row) => {
            const parseTs = (v: any): number => {
              if (v === null || v === undefined) return 0;
              if (typeof v === 'number') {
                const ts = v > 1e12 ? v : v * 1000;
                return ts + (8 * 60 * 60 * 1000);
              }
              if (typeof v === 'string') {
                const n = Number(v);
                if (!Number.isNaN(n)) {
                  const ts = n > 1e12 ? n : n * 1000;
                  return ts + (8 * 60 * 60 * 1000);
                }
                const d = Date.parse(v);
                if (Number.isNaN(d)) return 0;
                return d + (8 * 60 * 60 * 1000);
              }
              return 0;
            };
            const aVal = a[key];
            const bVal = b[key];
            return parseTs(aVal) - parseTs(bVal);
          }
        : (!isAddressField
          ? (a: Row, b: Row) => {
              const aVal = parseFloat(a[key] || 0);
              const bVal = parseFloat(b[key] || 0);
              return aVal - bVal;
            }
          : undefined);
      
      // 确定当前列的排序状态
      const currentSortOrder = sortedInfo.columnKey === key ? sortedInfo.order : undefined;
      
      return {
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
        sorter: handleSorter,
        sortOrder: currentSortOrder,
        sortDirections: ['ascend', 'descend'] as SortOrder[],
        showSorterTooltip: false,
        render: (value: any) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          if (!isAddressField && !isNaN(parseFloat(value)) && !isCreateTime) {
            return parseFloat(value).toLocaleString();
          }
          if (isCreateTime) {
            const ts = (() => {
              if (typeof value === 'number') {
                const timestamp = value > 1e12 ? value : value * 1000;
                return timestamp + (8 * 60 * 60 * 1000);
              }
              const n = Number(value);
              if (!Number.isNaN(n)) {
                const timestamp = n > 1e12 ? n : n * 1000;
                return timestamp + (8 * 60 * 60 * 1000);
              }
              const d = Date.parse(value);
              if (Number.isNaN(d)) return 0;
              return d + (8 * 60 * 60 * 1000);
            })();
            if (!ts) return String(value);
            const date = new Date(ts);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hour = String(date.getHours()).padStart(2, '0');
            const minute = String(date.getMinutes()).padStart(2, '0');
            const second = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
          }
          return String(value);
        },
      };
    });
  }, [rows, filteredRows, sortedInfo]);

  const windowStats: WindowStat[] = useMemo(() => {
    const now = Date.now();
    const windows = [
      { key: '1h', label: '1 hour', ms: 1 * 60 * 60 * 1000 },
      { key: '24h', label: '24 hours', ms: 24 * 60 * 60 * 1000 },
      { key: '72h', label: '72 hours', ms: 72 * 60 * 60 * 1000 },
      { key: '30d', label: '1 month', ms: 30 * 24 * 60 * 60 * 1000 },
    ];

    const parseTs = (v: any): number => {
      if (v === null || v === undefined) return 0;
      if (typeof v === 'number') {
        // 如果是秒级时间戳，转换为毫秒
        const ts = v > 1e12 ? v : v * 1000;
        // UTC时间转换为UTC+7，减去7小时的毫秒数
        return ts +(8 * 60 * 60 * 1000);
      }
      const n = Number(v);
      if (!Number.isNaN(n)) {
        const ts = n > 1e12 ? n : n * 1000;
        return ts +(8 * 60 * 60 * 1000);
      }
      const d = Date.parse(v);
      if (Number.isNaN(d)) return 0;
      // 如果解析的是UTC时间字符串，也需要转换
      return d +(8 * 60 * 60 * 1000);
    };

    const numeric = (v: any): number => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    const results: WindowStat[] = windows.map(w => {
      const rowsInWindow = filteredRows.filter(r => {
        const ts = parseTs(r.create_time ?? r.update_time ?? r.timestamp);
        return ts >= now - w.ms;
      });

      const sums = rowsInWindow.reduce(
        (acc, r) => {
          acc.total += numeric((r as any).total);
          acc.success += numeric((r as any).success);
          acc.failure += numeric((r as any).failure);
          acc.revenue_cfx += numeric((r as any).revenue_cfx);
          acc.revenue_usdt += numeric((r as any).revenue_usdt);
          const firstFailVal = (r as any).is_first_fail;
          acc.is_first_fail += firstFailVal ? 1 : 0;
          return acc;
        },
        { total: 0, success: 0, failure: 0, revenue_cfx: 0, revenue_usdt: 0, is_first_fail: 0 }
      );

      return { key: w.key, label: w.label, ...sums } as WindowStat;
    });

    return results;
  }, [filteredRows]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: 6, 
          padding: 12, 
          backgroundColor: '#fffbe6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ maxWidth: '85%' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6, color: '#fa8c16' }}>AI Report(24hour)</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{aiLoading ? 'loading...' : (aiSummary || 'none')}</div>
          </div>
          <div>
            <Button size="small" onClick={() => requestAiSummary(filteredRows)} loading={aiLoading}>
              rnew
            </Button>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
          {windowStats.map(stat => (
            <div key={stat.key} style={{ 
              border: '1px solid #d9d9d9', 
              borderRadius: 6, 
              padding: 12, 
              backgroundColor: '#fafafa' 
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#1890ff' }}>
                {stat.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: '13px' }}>
                <div>total: <strong>{stat.total}</strong></div>
                <div>success: <strong>{stat.success}</strong></div>
                <div>failure: <strong>{stat.failure}</strong></div>
                <div>is_first_fail: <strong>{stat.is_first_fail}</strong></div>
                <div>revenue_cfx: <strong>{stat.revenue_cfx.toFixed(2)}</strong></div>
                <div>revenue_usdt: <strong>{stat.revenue_usdt.toFixed(2)}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <Input
          placeholder="filter address..."
          prefix={<SearchOutlined />}
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Button onClick={fetchData} disabled={loading}>
        </Button>
        {loading && <Spin />}
        <Typography.Text type="secondary">
          total {filteredRows.length} / {rows.length} lines
        </Typography.Text>
      </div>

      <Table
        rowKey={(r) => r.address || r.id || r.key || String(r.create_time) + Math.random().toString(36).slice(2)}
        dataSource={filteredRows}
        columns={columns}
        size="small"
        scroll={{ x: true }}
        onChange={(pagination: TablePaginationConfig, filters: Record<string, FilterValue | null>, sorter: SorterResult<Row> | SorterResult<Row>[]) => {
          // 处理多列排序和空排序状态
          if (Array.isArray(sorter)) {
            // 多列排序，取第一个
            setSortedInfo(sorter[0] || {});
          } else if (sorter && sorter.columnKey) {
            // 单列排序
            setSortedInfo(sorter);
          } else {
            // 清除排序状态
            setSortedInfo({});
          }
        }}
        pagination={{ 
          pageSize: 20, 
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
        }}
        summary={() => (
          <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
            {columns.map((column, index) => {
              const key = column.dataIndex as string;
              if (key && summaryData[key] !== undefined) {
                return (
                  <Table.Summary.Cell key={index} index={index}>
                    {summaryData[key].toLocaleString(undefined, { 
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 4 
                    })}
                  </Table.Summary.Cell>
                );
              } else {
                return <Table.Summary.Cell key={index} index={index} />;
              }
            })}
          </Table.Summary.Row>
        )}
      />
    </div>
  );
};

export default UniLogTable;

