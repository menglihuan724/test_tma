import React, { useEffect, useMemo, useState } from "react";
import { Table, Spin, Typography, message, Button, Input, Tag } from "antd";
import type { SortOrder } from "antd/es/table/interface";
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
    const fieldSet = new Set<string>();
    rows.forEach((r) => Object.keys(r).forEach((k) => fieldSet.add(k)));
    const keys = Array.from(fieldSet);
    
    return keys.map((key) => {
      const isAddressField = ['address'].some(field => 
        key.toLowerCase().includes(field)
      );
      const isCreateTime = key.toLowerCase().includes('create_time');
      
      return {
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
        sorter: isCreateTime
          ? (a: any, b: any) => {
              const parseTs = (v: any): number => {
                if (v === null || v === undefined) return 0;
                if (typeof v === 'number') {
                  // 可能是秒或毫秒
                  return v > 1e12 ? v : v * 1000;
                }
                if (typeof v === 'string') {
                  const n = Number(v);
                  if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
                  const d = Date.parse(v);
                  return Number.isNaN(d) ? 0 : d;
                }
                return 0;
              };
              return parseTs(a[key]) - parseTs(b[key]);
            }
          : (!isAddressField
            ? (a: any, b: any) => {
                const aVal = parseFloat(a[key] || 0);
                const bVal = parseFloat(b[key] || 0);
                return aVal - bVal;
              }
            : undefined),
        sortDirections: (isCreateTime || !isAddressField) ? ['descend', 'ascend'] as SortOrder[] : undefined,
        render: (value: any) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          if (!isAddressField && !isNaN(parseFloat(value)) && !isCreateTime) {
            return parseFloat(value).toLocaleString();
          }
          if (isCreateTime) {
            const ts = (() => {
              if (typeof value === 'number') return value > 1e12 ? value : value * 1000;
              const n = Number(value);
              if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
              const d = Date.parse(value);
              return Number.isNaN(d) ? 0 : d;
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
  }, [rows]);

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
      if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
      const n = Number(v);
      if (!Number.isNaN(n)) return n > 1e12 ? n : n * 1000;
      const d = Date.parse(v);
      return Number.isNaN(d) ? 0 : d;
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
        rowKey={(r) => String(r.address ?? JSON.stringify(r))}
        dataSource={filteredRows}
        columns={columns}
        size="small"
        scroll={{ x: true }}
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

