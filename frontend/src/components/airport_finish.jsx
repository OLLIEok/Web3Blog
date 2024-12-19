
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Skeleton, Form, Input, Progress, Table,InputNumber } from 'antd';
import { motion } from 'framer-motion';
const EditableContext = React.createContext(null);
const EditableRow = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};
const EditableCell = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef(null);
    const form = useContext(EditableContext);
    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
    }, [editing]);
    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({
            [dataIndex]: record[dataIndex],
        });
    };
    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({
                ...record,
                ...values,
            });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };
    let childNode = children;
    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{
                    margin: 0,
                }}
                name={dataIndex}
                rules={[
                    {
                        required: true,
                        message: `${title} is required.`,
                    },
                ]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{
                    paddingInlineEnd: 24,
                }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }
    return <td {...restProps}>{childNode}</td>;
};
const FinishAirport = (props) => {
    const { isAdmin } = props;
    const [dataSource, setDataSource] = useState([
        {
            key: '0',
            name: 'Edward King 0',
            start_time: Date.now() - 1000 * 1000 * 60 * 24,
            end_time: Date.now() - 500 * 1000 * 60 * 24,
            final_time: Date.now() + 2000 * 1000 * 60 * 24,
            address: "www.baidu.com",
            tag: "区块链,AI",
            financing_balance: "3000$",
            financing_from: "a16z,binance",
            task_type: "拉人头,交互",
            balance: 1000
        },
        {
            key: '1',
            name: 'Edward King 0',
            start_time: Date.now() - 1000 * 60 * 24,
            end_time: Date.now() - 250 * 1000 * 60 * 24,
            final_time:Date.now() + 2000 * 1000 * 60 * 24,
            address: "www.baidu.com",
            tag: "区块链,AI",
            financing_balance: "3000$",
            financing_from: "a16z,binance",
            task_type: "拉人头,交互",
            // balance: 1000
        },
    ]);
    //TODO
    const handleDelete = (key) => {
        const newData = dataSource.filter((item) => item.key !== key);
        setDataSource(newData);
    };
    //TODO
    const handleComplete = (key) => {
        const newData = dataSource.filter((item) => item.key !== key);
        setDataSource(newData);
    }
    const defaultColumns = [
        {
            title: '进度',
            render: (_, record) => {
                let end = record.end_time;
                let final = record.final_time;
                let now = Date.now();
                let p = Math.floor((now - end) / (final - end) * 100);
                return (
                    <Progress percent={p} percentPosition={{ align: 'center', type: 'inner' }} size={[100, 20]} />
                );
            }
        },
        {
            title: '项目名',
            dataIndex: 'name',
            editable: true,
        },
        {
            title: '官网地址',
            dataIndex: 'address',
            editable: true,
            render: (_, record) => {
                return <a href={record.address}>官网地址</a>
            }
        },
        {
            title: '赛道',
            dataIndex: 'tag',
            editable: true,
        },
        {
            title: '融资金额',
            dataIndex: 'financing_balance',
            editable: true,
        },
        {
            title: '融资来源方',
            dataIndex: 'financing_from',
            editable: true,
        },
        {
            title: '教程',
            dataIndex: 'teaching',
            editable: true,
            render: (_, record) => {
                return <a href={record.teaching}>教程链接</a>
            }
        },
        {
            title: '任务类型',
            dataIndex: 'task_type',
            editable: true
        },
        {
            title: '空投金额',
            dataIndex: "balance",
            editable: true,
            render: (_, record) => {
                return(
                    record.balance ? <div >
                        <InputNumber
                            defaultValue={record.balance}
                            className={"max-w-20 max-h-8  "}
                            min="0"
                            step="0.00000000000001"
                            onChange={(event) => { console.log("change obtain balance",event) }}
                            stringMode 
                        />
                    </div>
                    : <Skeleton paragraph={{
                        rows: 1,
                      }} active />
                )
            }
        },
        {
            title: '进展',
            dataIndex: 'operation',
            render: (_, record) =>
                dataSource.length >= 1 ? (
                    isAdmin && <div className={"w-full justify-center items-center flex-col"}>

                        <motion.button whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className={"motion-button  px-1"} title="删除空投"
                            style={{ width: "80px", height: "40px" }}
                            key={record.key}
                            onClick={() => handleDelete(record.key)}>
                            <a>删除空投</a>
                        </motion.button>

                    </div>
                ) : null,
        },
    ];
    const handleAdd = () => {

        setDataSource([...dataSource, newData]);
    };
    const handleSave = (row) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => row.key === item.key);
        const item = newData[index];
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        setDataSource(newData);
    };
    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };
    const columns = defaultColumns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
                handleSave,
            }),
        };
    });
    return (
        <div className={"w-full h-full flex justify-center items-center flex-col"}>
            <div>
                <Table
                    tableLayout={"auto"}
                    components={components}
                    rowClassName={() => 'editable-row'}
                    bordered
                    className={"w-full flex justify-center items-center h-full"}
                    dataSource={dataSource}
                    columns={columns}
                />
            </div>
        </div>
    )
}
export default FinishAirport;