
import React, { useContext, useEffect, useRef, useState } from 'react';
import {Skeleton, Form, Input, Progress, Table, InputNumber, Tag, Tooltip, Statistic, Button,DatePicker, Modal} from 'antd';
import { motion } from 'framer-motion';
import {ClockCircleOutlined, InfoCircleOutlined} from "@ant-design/icons";
import {Star} from "./index.js";
import Constants from '../util/constants.js';
import { toast } from 'react-toastify';
import { HttpAgent } from '../agent/agent.jsx';
import { AirportStatus } from '../util/airport.js';
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
const { RangePicker } = DatePicker;
const  ObtainAirportStatus =(item)=>{
    const final_time =new Date(item.final_time).getTime();
    const now = Date.now();
    if(!final_time&&final_time>now){
        item.status =AirportStatus.Obtaining;
    }else{
        item.status =AirportStatus.Finish;
    }
}
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
const FinishAirport = () => {
    const { AirportClient,isAdmin} = useContext(HttpAgent);
    const [dataSource, setDataSource] = useState(null);
    useEffect(()=>{
            findFinishAirportByPage(1,Constants.PageSize)
    },[])
    const findFinishAirportByPage = (page,pagesize)=>{
        AirportClient.FindFinishAirport(page,pagesize).then((data)=>{
            if (data === undefined || data === null||!data.status) {
                toast.error("查询失败");
                return;
            }
            
            if (data.data){
            setDataSource(data.data.map((item)=>{item.key=item.id;return ObtainAirportStatus(item)}));
            }
        })
    }
    const handleDelete =async (item) => {
        const resp = await AirportClient.DeleteAirport(item.id);
        if(!resp||!resp.status){
            toast.error('删除'+item.name+'空投失败');
           return;
      }
        const newData = dataSource.filter((data) => item.key !== data.key);
        setDataSource(newData);
        toast.success('删除'+item.name+'空投');
    };
    //TODO
    const handleComplete = (key) => {
        const newData = dataSource.filter((item) => item.key !== key);
        setDataSource(newData);
    }
    const defaultColumns = [
        {
            title: "状态",
            align: "center",
            dataIndex: "status",
            render: (_, record) => {
                switch (record.status) {
                    case AirportStatus.Obtaining:
                        return (
                            <Tag icon={<SyncOutlined spin/>} color="processing">
                                领取中
                            </Tag>
                        )
                    case AirportStatus.Finish:
                        return (
                            <Tag icon={<ClockCircleOutlined />} color="default">
                                已结束
                            </Tag>
                        )
                }
            }
        },
        {
            title: '进度',
            align: "center",
            render: (_, record) => {
                let end = new Date(record.end_time).getTime();
                let final = new Date(record.final_time).getTime();
                let now = Date.now();
                let finish_p =Math.floor((now - end)/(final -end )*100)
                return (
                    record.status === AirportStatus.Finish?<Skeleton paragraph={{
                        rows: 1,
                    }} active />:<Progress
                        format={(percent) => `领取中: ${percent}%`}
                        percent={finish_p} percentPosition={{align: 'center', type: 'outer'}} size={[100, 30]}/>
                    
                );
            }
        },
        {
            title: '项目名',
            dataIndex: 'name',
            editable: true,
            align:"center",
        },
        {
            title: '官网地址',
            dataIndex: 'address',
            editable: true,
            align:"center",
            render: (_, record) => {
                return <a href={record.address}>官网地址</a>
            }
        },
        {
            title: '赛道',
            dataIndex: 'tag',
            editable: true,
            align:"center",
            render:(_,record)=>{
                return   <div className={"flex  justify-center items-center"}>
                    {record.tag.split(',').map((tag) => {
                        let color = tag.length > 5 ? 'geekblue' : 'green';
                        if (tag === 'loser') {
                            color = 'volcano';
                        }
                        return (
                            <Tag color={color} key={tag}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </div>
            }
        },
        {
            title: '融资金额',
            dataIndex: 'financing_balance',
            editable: true,
            align:"center",
        },
        {
            title: '融资来源方',
            dataIndex: 'financing_from',
            editable: true,
            align:"center",
            render:(_,record)=>{
                return   <div className={"flex  justify-center items-center"}>
                    {record.financing_from.split(',').map((tag) => {
                        let color = tag.length > 5 ? 'geekblue' : 'volcano';
                        return (
                            <Tag color={color} key={tag}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </div>
            }
        },
        {
            title: '教程',
            dataIndex: 'teaching',
            editable: true,
            align:"center",
            render: (_, record) => {
                return <a href={record.teaching}>教程链接</a>
            }
        },
        {
            title: '任务类型',
            dataIndex: 'task_type',
            editable: true,
            align:"center",
            render:(_,record)=>{
                return   <div className={"flex  justify-center items-center"}>
                    {record.task_type.split(',').map((tag) => {
                        let color = tag.length > 5 ? 'magenta' : 'purple';
                        return (
                            <Tag color={color} key={tag}>
                                {tag.toUpperCase()}
                            </Tag>
                        );
                    })}
                </div>
            }
        },
        {
            title:<Tooltip placement={"rightTop"} color={"rgba(116,112,112,0.88)"} title={"该空投在平台收集的空投中的评分"}>空投质量<InfoCircleOutlined  className={"relative  bottom-3 left-2"}/></Tooltip>,
            dataIndex: 'weight',
            align:"center",
            render:(_,record)=>{
                return (
                    <Star number={record.weight}/>
                )
            }
        },
        {
            title: <Tooltip placement={"rightTop"} color={"rgba(116,112,112,0.88)"} title={"平台用户获取该空投的总数量"}>空投数量<InfoCircleOutlined  className={"relative  bottom-3 left-2"}/></Tooltip>,
            dataIndex: "airport_balance",
            align:"center",
            render: (_, record) => {
                return(
                    record.airport_balance ? <div className={"flex w-full h-full justify-center items-center "} style={{fontSize:"12px"}}>
                            <Statistic  value={record.airport_balance} />
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
            align:"center",
            hidden:!isAdmin,
            render: (_, record) =>
                dataSource.length >= 1 ? (
                    isAdmin && <div className={"w-full justify-center items-center flex-col"}>

                        <motion.button whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className={"motion-button  px-1"} title="删除空投"
                            style={{ width: "80px", height: "40px" }}
                            key={record.key}
                            onClick={() => handleDelete(record)}>
                            <a>删除空投</a>
                        </motion.button>

                    </div>
                ) : null,
        },
    ];
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
                  key={"finish"}
                    tableLayout={"auto"}
                    components={components}
                     sticky
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