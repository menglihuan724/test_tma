import React, { useEffect, useMemo, useState } from "react";
import { Table, Spin, Typography, message, Button, Input } from "antd";
import type { SortOrder } from "antd/es/table/interface";
import { SearchOutlined } from "@ant-design/icons";

type Row = Record<string, any> & { address?: string };

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
      const isAddressField = ['address', 'create_time', 'update_time'].some(field => 
        key.toLowerCase().includes(field)
      );
      
      return {
        title: key,
        dataIndex: key,
        key,
        ellipsis: true,
        sorter: !isAddressField ? (a: any, b: any) => {
          const aVal = parseFloat(a[key] || 0);
          const bVal = parseFloat(b[key] || 0);
          return aVal - bVal;
        } : undefined,
        sortDirections: !isAddressField ? ['descend', 'ascend'] as SortOrder[] : undefined,
        render: (value: any) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object") return JSON.stringify(value);
          if (!isAddressField && !isNaN(parseFloat(value))) {
            return parseFloat(value).toLocaleString();
          }
          return String(value);
        },
      };
    });
  }, [rows]);

  return (
    <div>
      {/* 筛选和操作 */}
      <div style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
        <Input
          placeholder="筛选地址..."
          prefix={<SearchOutlined />}
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Button onClick={fetchData} disabled={loading}>
          刷新
        </Button>
        {loading && <Spin />}
        <Typography.Text type="secondary">
          显示 {filteredRows.length} / {rows.length} 条
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

