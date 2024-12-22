import React, {useContext, useEffect, useRef, useState} from 'react';
import {Form, Input, Modal, Progress, Table,Tooltip,Tag,DatePicker,Select,InputNumber, Mentions} from 'antd';
import {ClockCircleFilled, ClockCircleOutlined, InfoCircleOutlined,SyncOutlined } from '@ant-design/icons';
import {motion} from 'framer-motion';
import { HttpAgent} from '../agent/agent';
import {toast} from "react-toastify";
import Constants from "../util/constants.js";
import Star from './star.jsx';
import { AirportStatus } from '../util/airport.js';
const { RangePicker } = DatePicker;
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
const formItemLayout = {
    labelCol: {
      xs: {
        span: 24,
      },
      sm: {
        span: 6,
      },
    },
    wrapperCol: {
      xs: {
        span: 24,
      },
      sm: {
        span: 14,
      },
    },
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
        console.log(record);
    };
    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({
                ...record,
                ...values,
            });
            console.log(values);
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
const ObtainAirportStatus =(item)=>{
    const now = Date.now();
    const airport_start_time = new Date(item.start_time).getTime();
    if (airport_start_time>now){
        item.status = AirportStatus.UnStart;
    }else{
        item.status = AirportStatus.Running;
    }
    return item 
}

const RunningAirport = (props) => {
    const {isAdmin} = props;
    const [dataSource, setDataSource] = useState(null);
    const [form] = Form.useForm();
    const variant = Form.useWatch('variant', form);
    const [openCreate,setOpenCreate] = useState(false);
    const { AirportClient} = useContext(HttpAgent);
    useEffect(() => {
            findRunningAirport(1,Constants.PageSize);
    }, [])
    const findRunningAirport = (page, pageSize) => {
        AirportClient.FindRunningAirport(page, pageSize).then((data) => {
            if (!data||!data.status){
                toast.error("查询失败");
                return;
            }
            if(data.data){
            setDataSource(data.data.map((item)=>{item.key=item.id;return ObtainAirportStatus(item)}));
            }
        })
    }
    const addNewAirport = async (item)=>{
        item.start_time = item.airport_time[0];
        item.end_time = item.airport_time[1];
        const resp = await AirportClient.AddAirport(item);
        if (!data||!data.status){
            toast.error("创建失败");
            return;
        }
        toast.success("创建"+item.name+"成功")
        const newDatasource = [...dataSource,item];
        setDataSource(newDatasource);
    }
    //TODO
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
    const handleAddMyAirport =async (item) => {
       const resp = await AirportClient.AddAirportIntoAddress(item.id)
       if(!resp||!resp.status){
             toast.error('添加'+item.name+'空投失败');
            return;
       }
        const newData = dataSource.filter((value) => value.key !== item.key);
        setDataSource(newData);
        toast.success('添加'+item.name+'空投');
    }
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
    //TODO
    const handleComplete = (item) => {
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
                    case AirportStatus.Running || AirportStatus.UnFinishToday:
                        return (
                            <Tag icon={<SyncOutlined spin/>} color="processing">
                                进行中
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
            render: (_, record) => {
                let start = new Date(record.start_time).getTime();
                let end = new Date(record.end_time).getTime();
                let now = Date.now();
                let p = Math.floor((now - start) / (end - start) * 100);
                return (
                    <Progress percent={p} percentPosition={{align: 'center', type: 'inner'}} size={[100, 20]}/>
                );
            }
        },
        {
            title: '项目名',
            dataIndex: 'name',
            editable: isAdmin,
        },
        {
            title: '官网地址',
            dataIndex: 'address',
            editable: isAdmin,
            render: (_, record) => {
                return <a href={record.address}>官网地址</a>
            }
        },
        {
            title: '赛道',
            dataIndex: 'tag',
            editable: isAdmin,
        },
        {
            title: '融资金额',
            dataIndex: 'financing_balance',
            editable: isAdmin,
        },
        {
            title: '融资来源方',
            dataIndex: 'financing_from',
            editable: isAdmin,
        },
        {
            title: '教程',
            dataIndex: 'teaching',
            editable: isAdmin,
            render: (_, record) => {
                return <a href={record.teaching}>教程链接</a>
            }
        },
        {
            title: '任务类型',
            dataIndex: 'task_type',
            editable: isAdmin
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
            title: '进展',
            dataIndex: 'operation',
            render: (_, record) =>
                dataSource.length >= 1 ? (
                    <div className={"w-full justify-center items-center flex-col"}>
                        <motion.button whileHover={{scale: 1.1}}
                                       whileTap={{scale: 0.9}}
                                       style={{width: "80px", height: "40px"}}
                                       transition={{type: "spring", stiffness: 400, damping: 10}}
                                       className={"motion-button  px-1"} title="加入计划"
                                       key={record.key}
                                       onClick={() => handleAddMyAirport(record)}
                        >
                            <a>加入计划</a>
                        </motion.button>
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
                    </div>

                ) : null,
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
    return (<>
           <Modal open={openCreate} closable={false} footer={null}>
            <Form
      {...formItemLayout}
      form={form}
      variant={variant || 'filled'}
      style={{
        maxWidth: 600,
      }}
      initialValues={{
        variant: 'filled',
      }}
    >
   

      <Form.Item
        label="空投名"
        name="name"
        validateDebounce={1000}
        rules={[
          {
            required: true,
            message: '空投名不能为空',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="官网"
        name="address"
        validateDebounce={1000}
        rules={[
          {
            type: 'url',
            required: true,
            message: '请输入一个链接',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="赛道"
        name="tag"
        validateDebounce={1000}
        rules={[
          {
            required: true,
            message: 'Please input!',
          },
        ]}
      >
        <Mentions />
      </Form.Item>
      <Form.Item
        label="融资金额"
        name="financing_balance"
      >
        <InputNumber suffix={"$"} />
      </Form.Item>
      <Form.Item
        label="融资来源方"
        name="financing_from"
        validateDebounce={1000}
        rules={[
          {
            required: true,
            message: 'Please input!',
          },
        ]}
      >
         <Mentions/>  
      </Form.Item>
      <Form.Item
        label="教程"
        name="teaching"
        validateDebounce={1000}
        rules={[
          {
            type: 'url',
            required: true,
            message: '请输入一个链接',
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        validateDebounce={1000}
        label="任务类型"
        name="task_type"
        rules={[
          {
            required: true,
            message: '请输入空投的任务类型',
          },
        ]}
      >
      <Mentions />
      </Form.Item>
      <Form.Item
        label="空投质量"
        name="weight"
        rules={[
          {
            required: true,
            message: '请选择空投质量',
          },
        ]}
      >
        <Select>
        <Select.Option value={1}><Star number={1} /></Select.Option>
        <Select.Option value={2}><Star number={2} /></Select.Option>
        <Select.Option value={3}><Star number={3} /></Select.Option>
        <Select.Option value={4}><Star number={4} /></Select.Option>
        <Select.Option value={5}><Star number={5} /></Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        label="空投时间"
        name="airport_time"
        rules={[
          {
            required: true,
            message: '请选择空投任务的时间区间',
          },
        ]}
      >
       <RangePicker />
      </Form.Item>
      <Form.Item
        label="空投领取结束时间"
        name="final_time"
        rules={[
          {
            required: true,
            message: '',
          },
        ]}
      >
       <DatePicker />
      </Form.Item>
      <Form.Item
        wrapperCol={{
          offset: 6,
          span: 16,
        }}
        className='flex justify-center items-center'
      >
        <motion.button whileHover={{scale: 1.1}}
                                           whileTap={{scale: 0.9}}
                                           transition={{type: "spring", stiffness: 400, damping: 10}}
                                           className={"motion-button  px-1"} title="新增"
                                           style={{width: "80px", height: "40px"}} onClick={()=>{addNewAirport(form.getFieldsValue())}}>
          添加
        </motion.button>
      </Form.Item>
    </Form>
    </Modal>
            <div className={"w-full h-full flex justify-center items-center flex-col"}>
                {isAdmin && <div className={"w-full h-full flex justify-center items-center"}>
                    <div className={"w-full items-center justify-start flex pb-4 pl-4"}>
                        <motion.button
                            className={"motion-button   flex justify-center items-center  md:text-md lg:text-xl text-white"}
                            whileHover={{scale: 1.1}}
                            whileTap={{scale: 0.9}}
                            transition={{type: "spring", stiffness: 400, damping: 10}}
                            onClick={()=>{setOpenCreate(!openCreate)}}
                        >
                            新增空投
                        </motion.button>
                    </div>
                </div>
                }
                <div className={"w-full h-full justify-center items-center"}>
                    <Table
                        key={"running"}
                        tableLayout={"auto"}
                        components={components}
                        rowClassName={() => 'editable-row'}
                        bordered
                        size={"large"}
                        sticky
                        className={"w-full flex justify-center items-center h-full"}
                        dataSource={dataSource}
                        columns={columns}
                    />
                </div>
            </div>
        </>
    )
}

export default RunningAirport;