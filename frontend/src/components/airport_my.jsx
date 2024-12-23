import React, {useContext, useEffect, useRef, useState} from 'react';
import {Form, Input, Progress, Skeleton, Statistic, Table, Tag, Tooltip} from 'antd';
import {motion} from 'framer-motion';
import {CheckCircleOutlined, ExclamationCircleOutlined,MinusCircleOutlined, ClockCircleOutlined ,InfoCircleOutlined, SyncOutlined} from "@ant-design/icons";
import {Star} from "./index.js";
import {isToday} from "../util/date.js";
import { toast } from 'react-toastify';
import Constants from '../util/constants.js';
import { AirportStatus } from '../util/airport.js';
import { HttpAgent } from '../agent/agent.jsx';

const EditableContext = React.createContext(null);
const EditableRow = ({index, ...props}) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

const ObtainAirportStatus = (item)=>{
    const now = Date.now();
    const airport_start_time = new Date(item.start_time).getTime();
    const airport_end_time = new Date(item.end_time).getTime();
    if (airport_start_time>now){
        item.status = AirportStatus.UnStart;
    }else if(!airport_end_time || now < airport_end_time ){
        if (!item.user_update_time){
            item.status= AirportStatus.UnFinishToday;
        }else{
        const airport_user_update_time =new Date(item.user_update_time).getTime();
        if (!isToday(airport_user_update_time)){
            item.status= AirportStatus.UnFinishToday;
        }else{
            item.status = AirportStatus.Running;
        }
    }
    }else {
    
        let airport_user_finish_time =now;
        if (item.user_finish_time){
            airport_user_finish_time = new Date(item.user_finish_time).getTime();
        }
            if (airport_end_time<airport_user_finish_time){
                    item.status =AirportStatus.Expire;
            }else if (item.user_finish_time){
                    item.status =AirportStatus.SuccessObtain;
            }else{
                item.status =AirportStatus.NeedToObtain;
            }
        
    }
    return item;
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
                <Input ref={inputRef} onPressEnter={save} onBlur={save}/>
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
const MyAirport = () => {

    const { AirportClient,isAdmin} = useContext(HttpAgent);
    const [dataSource, setDataSource] = useState([]);
    useEffect(()=>{
            findMyAirport(1,Constants.PageSize);
    },[])
    const findMyAirport = (page, pageSize) => {
        AirportClient.FindAirportByAddress(page, pageSize).then((data) => {

            if (!data||!data.status){
                toast.error("查询失败");
                return;
            }
            if(data.data){
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
        const newData = dataSource.filter((data) => data.key !== item.key);
        setDataSource(newData);
        toast.success('删除'+item.name+'空投');
    };
    const finishAirport = async (item)=>{
        const resp =await AirportClient.FinishAirport(item.id);
        if(!resp||!resp.status){
            toast.error("结束"+item.name+"空投失败");
           return;
      }
      const newData = dataSource.filter((value) => value.key !== item.key);
      setDataSource(newData);
      toast.info(item.name+"已结束");
    }
    const handleTodayFinish =async (item)=>{
        const resp = await AirportClient.UpdateAirportByUpdateTime(item.key);
         if (!resp || !resp.status){
            toast.error("系统出错");
            return;
        }

        const newData =dataSource.filter((data) => {
            if (item.key === data.key){
                data.user_update_time  =resp.data;
            }
            return true;
        });
        setDataSource(newData);
        toast.success("完成"+item.name+"今日的空投任务");
    }
    const handleObtainAirport=async (item)=>{
        const resp = await AirportClient.UpdateAirportByFinishTime(item.id);
        if (!resp || !resp.status){
            toast.error("领取失败");
            return;
        }
        const newData =dataSource.filter((data) => {
            if (data.key == item.key){
            item.status= "SUCCESS";
            }
            return true
             }
            );
        setDataSource(newData);
        toast.success("领取空投"+item.name+"成功")
    }
    const defaultColumns = [
        {
            title: "状态",
            align: "center",
            dataIndex: "status",
            render: (_, record) => {
                switch (record.status) {
                    case AirportStatus.SuccessObtain:
                        return (
                            <Tag icon={<CheckCircleOutlined/>} color="success">
                                空投领取
                            </Tag>
                        )
                    case AirportStatus.Running:
                        return (
                            <Tag icon={<SyncOutlined spin/>} color="processing">
                                进行中
                            </Tag>
                        )
                    case AirportStatus.UnFinishToday:
                        return (
                            <Tag icon={<SyncOutlined spin/>} color="processing">
                                进行中
                            </Tag>
                        )
                    case AirportStatus.NeedToObtain:
                        return (
                            <Tag icon={<ExclamationCircleOutlined/>} color="warning">
                                待领取
                            </Tag>
                        )
                    case AirportStatus.Expire:
                        return (
                            <Tag icon={<MinusCircleOutlined />} color="default">
                                已过期
                            </Tag>
                        )
                    case AirportStatus.UnStart:
                        return (
                            <Tag icon={<ClockCircleOutlined />} color="default">
                                未开始
                            </Tag>
                        )
                }
            }
        },
        {
            title: '进度',
            align: "center",
            render: (_, record) => {
                let start = new Date(record.start_time).getTime();
                let end = new Date(record.end_time).getTime();
                let final = new Date(record.final_time).getTime();
                let now = Date.now();
                let running_p = Math.floor((now - start) / (end - start) * 100);
                let finish_p =100;
                if (final!=end){
                    finish_p =Math.floor((now - end)/(final -end )*100);
                }
                return (
                    record.status === AirportStatus.UnStart||record.status === AirportStatus.Expire?<Skeleton paragraph={{
                        rows: 1,
                    }} active />:<Progress
                        format={(percent) => `${record.status === AirportStatus.Running||record.status === AirportStatus.UnFinishToday ? "空投进度:" : "领取进度:"} ${percent}%`}
                        percent={record.status === AirportStatus.Running||record.status === AirportStatus.UnFinishToday?running_p:finish_p} percentPosition={{align: 'center', type: 'outer'}} size={[100, 30]}/>
                    
                );
            }
        },
        {
            title: '项目名',
            dataIndex: 'name',
            align: "center",
        },
        {
            title: '官网地址',
            dataIndex: 'address',
            align: "center",
            render: (_, record) => {
                return <a href={record.address}>官网地址</a>
            }
        },
        {
            title: '赛道',
            dataIndex: 'tag',
            align: "center",
            render: (_, record) => {
                return <div className={"flex  justify-center items-center"}>
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
            align: "center",
            render:(_,item)=>{
                return  <Statistic  value={item.financing_balance} />
              }
        },
        {
            title: '融资来源方',
            dataIndex: 'financing_from',
            align: "center",
            render: (_, record) => {
                return <div className={"flex  justify-center items-center"}>
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
            align: "center",
            render: (_, record) => {
                return <a href={record.teaching}>教程链接</a>
            }
        },
        {
            title: <Tooltip placement={"rightTop"} color={"rgba(116,112,112,0.88)"}
                            title={"该空投在平台收集的空投中的评分"}>空投质量<InfoCircleOutlined
                className={"relative  bottom-3 left-2"}/></Tooltip>,
            dataIndex: 'weight',
            align: "center",
            render: (_, record) => {
                return (
                    <Star number={record.weight}/>
                )
            }
        },
        {
            title: '任务类型',
            dataIndex: 'task_type',
            align: "center",
            render: (_, record) => {
                return <div className={"flex  justify-center items-center"}>
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
            title: <Tooltip placement={"rightTop"} color={"rgba(116,112,112,0.88)"}
                            title={"平台用户获取该空投的总数量"}>空投数量<InfoCircleOutlined
                className={"relative  bottom-2 left-1"}/></Tooltip>,
            dataIndex: "balance",
            align: "center",
            render: (_, record) => (record.status === AirportStatus.SuccessObtain)? (
                <Statistic  value={record.balance}/>
            ):<Skeleton paragraph={{
            rows: 1,
        }} active />,
            onCell: (item) => {
                if (item.status === AirportStatus.SuccessObtain) {
                    return {colSpan: 2};
                } else {
                    return {colSpan: 0};
                }

            }
        },
        {
            title: '进展',
            dataIndex: 'operation',
            align: "center",
            onCell: (record) => {
                if (!isAdmin&&(record.status === AirportStatus.Expire|| record.status === AirportStatus.SuccessObtain|| record.status === AirportStatus.UnStart)) {
                    return {colSpan: 0};
                }
                return {
                    colSpan:2,
                }
            },
            render: (_, record) =>
                dataSource.length >= 1 && (<>{
                        record.stauts === AirportStatus.UnFinishToday &&
                        <motion.button whileHover={{scale: 1.1}}
                                       whileTap={{scale: 0.9}}
                                       transition={{type: "spring", stiffness: 400, damping: 10}}
                                       className={"motion-button  px-1"} title="完成任务"
                                       style={{width: "80px", height: "40px" ,background:"#b7eb8f"}}
                                       key={record.key}
                                       onClick={() => handleTodayFinish(record)}>
                            <a>今日完成</a>
                        </motion.button>
                    }
                        {record.status === AirportStatus.NeedToObtain && <motion.button whileHover={{scale: 1.1}}
                                                                       whileTap={{scale: 0.9}}
                                                                       transition={{
                                                                           type: "spring",
                                                                           stiffness: 400,
                                                                           damping: 10
                                                                       }}
                                                                       className={"motion-button  px-1"} title="领取空投"
                                                                       style={{width: "80px", height: "40px",background:"#faad14"}}
                                                                       key={record.key}
                                                                       onClick={() => handleObtainAirport(record)}>
                            <a>领取</a>
                        </motion.button>}
                        {isAdmin &&
                            <motion.button whileHover={{scale: 1.1}}
                                           whileTap={{scale: 0.9}}
                                           transition={{type: "spring", stiffness: 400, damping: 10}}
                                           className={"motion-button  px-1"} title="结束空投"
                                           style={{width: "80px", height: "40px"}}
                                           key={record.key}
                                           onClick={() => finishAirport(record)}>
                                <a>结束空投</a>
                            </motion.button>}
                        {isAdmin &&
                            <motion.button whileHover={{scale: 1.1}}
                                           whileTap={{scale: 0.9}}
                                           transition={{type: "spring", stiffness: 400, damping: 10}}
                                           className={"motion-button  px-1"} title="删除空投"
                                           style={{width: "80px", height: "40px"}}
                                           key={record.key}
                                           onClick={() => handleDelete(record)}>
                                <a>删除空投</a>
                            </motion.button>}
                    </>
                )
        },
    ];

    const handleSave =async (row) => {
        const newData = [...dataSource];
        const index = newData.findIndex((item) => row.key === item.key);
        const item = newData[index];
       const resp =await AirportClient.UpdateAirport(item);
       if(!resp||!resp.status){
        toast.error("修改"+item.name+"空投失败");
             return;
        }
        newData.splice(index, 1, {
            ...item,
            ...row,
        });
        setDataSource(newData);
        toast.success("修改"+item.name+"信息成功");
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
                  key={"my"}
                  sticky
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
export default MyAirport;