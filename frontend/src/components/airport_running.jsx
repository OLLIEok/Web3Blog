import React, {useContext, useEffect, useRef, useState} from 'react';
import {Form, Input, Modal, Progress, Table,Tooltip,Tag,DatePicker,Select,InputNumber,Statistic, Mentions,Button,Flex,Radio} from 'antd';
import { ClockCircleOutlined, InfoCircleOutlined,SyncOutlined,PlusOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons';
import {motion} from 'framer-motion';
import { HttpAgent} from '../agent/agent';
import {toast} from "react-toastify";
import Constants from "../util/constants.js";
import Star from './star.jsx';
import { AirportStatus } from '../util/airport.js';
import TagInput from './tagInput.jsx';
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

const RunningAirport = () => {

  const [trackTags, settTrackTags] = useState([]);
  const recommendTrackTags = ['Layer2', 'NFT', 'DEFI', 'AI'];
  const [financingTags, setFinancingTags] = useState([]);
  const [taskTags, setTaskTags] = useState([]);
  const recommendTaskTags = ['交易交互', '点赞关注', '玩游戏', '邀请好友'];
  const qualityOptions = [
    { label: 'D', value: 1 },
    { label: 'C', value: 2 },
    { label: 'B', value: 3 },
    { label: 'A', value: 4 },
    { label: 'S', value: 5 },
  ];

    const [dataSource, setDataSource] = useState(null);
    const [form] = Form.useForm();
    const variant = Form.useWatch('variant', form);
    const [openCreate,setOpenCreate] = useState(false);
    const { AirportClient,isAdmin} = useContext(HttpAgent);
    const [currentPage, setCurrentPage] = useState(1);  
    const [pageSize, setPageSize] = useState(10); 
    const [total, setTotal] = useState(); 
    useEffect(() => {      
            findRunningAirport(1,pageSize);
    }, [isAdmin]);
    const findRunningAirport = (page, pageSize) => {
        AirportClient.FindRunningAirport(page, pageSize).then((data) => {
            if (!data||!data.status){
                // toast.error("查询失败");
                return;
            }
            if(data.data.data && data.data.total){
              setDataSource(data.data.data.map((item)=>{item.key=item.id;return ObtainAirportStatus(item)}));
               setTotal(data.data.total);
              }
        })
    }
    const addNewAirport = async (item)=>{
        
        item.start_time = new Date(new Date(item.airport_time[0]).getTime()+ (8 * 60 * 60 * 1000));
        item.end_time = new Date(new Date(item.airport_time[1]).getTime()+ (8 * 60 * 60 * 1000));
        item.final_time = new Date(new Date(item.final_time).getTime()+ (8 * 60 * 60 * 1000));
        // item.task_type = item.task_type.replace(/@/g, "");
        // item.tag = item.tag.replace(/@/g, "");
        // item.financing_from = item.financing_from.replace(/@/g, "");
        // item.task_type = item.task_type.replace(/ /g, ",");
        // item.tag = item.tag.replace(/ /g, ",");
        // item.financing_from = item.financing_from.replace(/ /g, ",");
        
        item.task_type = Array.isArray(taskTags) ? taskTags.join(',') : '';
        item.tag = Array.isArray(trackTags) ? trackTags.join(',') : '';
        item.financing_from = Array.isArray(financingTags) ? financingTags.join(',') : '';
        console.log(item);
        const resp = await AirportClient.AddAirport(item);
        if (!resp||!resp.status){
            toast.error("创建失败");
            return;
        }
        toast.success("创建"+item.name+"成功")
        item = ObtainAirportStatus(item);
         const newDatasource = Array.isArray(dataSource) ? [...dataSource, item] : [item];
        setDataSource(newDatasource);
        setOpenCreate(!openCreate);
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

    const defaultColumns = [
        {
            title: "状态",
            align: "center",
            width: '7%',
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
            width: '8%',
            align: "center",
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
            width: '10%',
            dataIndex: 'name',
            align: "center",
            editable: isAdmin,
        },
        {
            title: '官网地址',
            width: '5%',
            dataIndex: 'address',
            align: "center",
            editable: isAdmin,
            render: (_, record) => {
                return <a href={record.address}>官网地址</a>
            }
        },
        {
            title: '赛道',
            width: '11%',
            dataIndex: 'tag',
            align: "center",
            editable: isAdmin,
            render: (_, record) => {
              return <div className={"flex  justify-center items-center flex-wrap"}>
                  {record.tag.split(',').map((tag) => {
                      let color = tag.length > 5 ? 'geekblue' : 'green';
                      if (tag === 'loser') {
                          color = 'volcano';
                      }
                      return (
                          <Tag color={color} key={tag} style={{ marginBottom: '4px' }}>
                              {tag.toUpperCase()}
                          </Tag>
                      );
                  })}
              </div>
          }
        },
        {
            title: '融资金额',
            width: '11%',
            align: "center",
            dataIndex: 'financing_balance',
            editable: isAdmin,
            render:(_,item)=>{
              return  <Statistic  value={item.financing_balance} />
            }
        },
        {
          title: '融资来源方',
          width: '12%',
          dataIndex: 'financing_from',
          align: "center",
          render: (_, record) => {
              return <div className={"flex  justify-center items-center flex-wrap"}>
                  {record.financing_from.split(',').map((tag) => {
                      let color = tag.length > 5 ? 'geekblue' : 'volcano';
                      return (
                          <Tag color={color} key={tag} style={{ marginBottom: '4px' }}>
                              {tag.toUpperCase()}
                          </Tag>
                      );
                  })}
              </div>
          }
      },
        {
            title: '教程',
            width: '5%',
            dataIndex: 'teaching',
            align: "center",
            editable: isAdmin,
            render: (_, record) => {
                return <a href={record.teaching}>教程链接</a>
            }
        },
        {
            title: '任务类型',
            width: '12%',
            dataIndex: 'task_type',
            align: "center",
            editable: isAdmin,
            render: (_, record) => {
              return <div className={"flex  justify-center items-center flex-wrap"}>
                  {record.task_type.split(',').map((tag) => {
                      let color = tag.length > 5 ? 'magenta' : 'purple';
                      return (
                          <Tag color={color} key={tag} style={{ marginBottom: '4px' }}>
                              {tag.toUpperCase()}
                          </Tag>
                      );
                  })}
              </div>
          }
        },
        {
            title: <Tooltip placement={"bottom"} color={"rgba(116,112,112,0.88)"}
                            title={"该空投在平台收集的空投中的评分"}>空投质量
               </Tooltip>,
            dataIndex: 'weight',
            width: '5%',
            align: "center",
            render: (_, record) => {
                return (
                    <Star number={record.weight}/>
                )
            }
        },
        {
            title: '进展',
            width: '6%',
            dataIndex: 'operation',
            align: "center",
            render: (_, record) =>
              dataSource.length >= 1 ? (
                <div className="flex flex-col items-center space-y-1"> 
                  <Tooltip title="加入计划" placement="bottom">
                    <motion.div 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }} 
                      transition={{ type: "spring", stiffness: 400, damping: 10 }} 
                      style={{ marginBottom: '5px' }} 
                      >
                        <PlusOutlined
                        className="text-blue-700" 
                        style={{ fontSize: '18px' }}
                        onClick={() => handleAddMyAirport(record)}/>
                    </motion.div>
                  </Tooltip>
                  {isAdmin && (
                    <Tooltip title="结束空投" placement="bottom">
                      <motion.div 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }} 
                      transition={{ type: "spring", stiffness: 400, damping: 10 }} 
                      style={{ marginBottom: '5px' }} 
                      >
                        <StopOutlined
                        className="text-green-600" 
                        style={{ fontSize: '18px' }}
                        onClick={() => finishAirport(record)}/>
                    </motion.div>
                    </Tooltip>
                  )}
                  {isAdmin && (
                    <Tooltip title="删除空投" placement="bottom">
                      <motion.div 
                      whileHover={{ scale: 1.1 }} 
                      whileTap={{ scale: 0.9 }} 
                      transition={{ type: "spring", stiffness: 400, damping: 10 }} 
                      style={{ marginBottom: '5px' }} 
                      >
                        <DeleteOutlined
                        className="text-red-600" 
                        style={{ fontSize: '18px' }}
                        onClick={() => handleDelete(record)}/>
                    </motion.div>
                    </Tooltip>
                  )}
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
           <Modal onClose={()=>{setOpenCreate(!openCreate)}} open={openCreate} onCancel={()=>setOpenCreate(!openCreate)} footer={null}>
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
        <Input placeholder='http:// 或 https:// 开头'/>
      </Form.Item>

      <Form.Item label="赛道" name="tag">
        <TagInput
          value={trackTags}
          onChange={settTrackTags}
          label="赛道"
          placeholder="新增赛道"
          tagStyle={{ backgroundColor: '#fff7e6', borderColor: '#ffd666' }}
        />
        <Flex gap="4px 0" wrap className='pt-2'>
          {recommendTrackTags.map((tag) => (
            <Tag
              key={tag}
              color="magenta"
              onClick={() => {
                if (!trackTags.includes(tag)) {
                  settTrackTags([...trackTags, tag]);
                }
              }} 
              style={{ cursor: 'pointer' }}
            >
              {tag}
            </Tag>
          ))}
        </Flex>
      </Form.Item>

      <Form.Item
        label="融资金额"
        name="financing_balance"
      >
        <InputNumber suffix={"$"} style={{ width: '45%' }}  />
      </Form.Item>

      <Form.Item label="融资来源方" name="financing_from">
        <TagInput
          value={financingTags}
          onChange={setFinancingTags}
          placeholder="新增融资来源"
          tagStyle={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
        />
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
        <Input placeholder='http:// 或 https:// 开头'/>
      </Form.Item>
      <Form.Item label="任务类型" name="task_type">
        <TagInput
          value={taskTags}
          onChange={setTaskTags}
          placeholder="新增任务类型"
          tagStyle={{ backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
        />
        <Flex gap="4px 0" wrap className='pt-2'>
          {recommendTaskTags.map((tag) => (
            <Tag
              key={tag}
              color="geekblue"
              onClick={() => {
                if (!taskTags.includes(tag)) {
                  setTaskTags([...taskTags, tag]);
                }
              }} 
              style={{ cursor: 'pointer' }}
            >
              {tag}
            </Tag>
          ))}
        </Flex>
      </Form.Item>

      {/* <Form.Item
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
      </Form.Item> */}
      <Form.Item
        label="空投质量"
        name="weight"
        rules={[{ required: true, message: '请选择空投质量!' }]}
      >
        <Radio.Group
          options={qualityOptions}
          optionType="button"  
          block  // 使选项填满容器宽度
        />
      </Form.Item>
      <Form.Item
        label="空投时间"
        name="airport_time"
      >
       <RangePicker />
      </Form.Item>
      <Form.Item
        label="空投领取截止时间"
        name="final_time"
      >
       <DatePicker />
      </Form.Item>
      <Form.Item
        wrapperCol={{
          offset: 5,
          span: 16,
        }}
        className='flex justify-center items-center'
      >
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    transition={{ type: "spring", stiffness: 400, damping: 10 }}
    className=" bg-blue-500 text-white  rounded-full"
    title="新增"
    style={{ width: "80px", height: "40px" }}
    onClick={() => { addNewAirport(form.getFieldsValue()); }}
  >
    添加
  </motion.button>  

      </Form.Item>
    </Form>
    </Modal>
            <div className={"w-full h-full flex justify-center items-center flex-col"}>
                {isAdmin && <div className={"w-full h-full flex justify-center items-center"}>
            <div className={"w-full items-center justify-start flex pb-2 pl-0"}>
                <motion.div
                    whileHover={{ scale: 1.05 }}  // 轻微放大效果
                    whileTap={{ scale: 0.95 }}    // 点击时缩小效果
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <Button
                        type="primary"
                        style={{
                            backgroundColor: "#1d53ab",  
                            borderColor: "#1d53ab",      
                        }}
                        onClick={() => setOpenCreate(!openCreate)}
                    >
                        新增空投
                    </Button>
                </motion.div>
            </div>
        </div>
                }
                {/* <div className={"w-full h-full justify-center items-center"}> */}
                    <Table
                                      key={"my"}
                                      sticky
                                        // tableLayout={"auto"}
                                        components={components}
                                        rowClassName={() => 'editable-row'}
                                        bordered
                                        className={"w-full   h-full"}
                                        dataSource={dataSource}
                                        columns={columns}
                                        scroll={{ x: true }}
                                        // size='midium'
                                        pagination={{
                                          current: currentPage,  
                                          pageSize: pageSize,     
                                          total: total,           
                                          showSizeChanger: true,  
                                          pageSizeOptions: ['1', '10', '25', '50'], 
                                          onChange: (page, size) => {
                                            setCurrentPage(page);
                                            setPageSize(size);
                                            findRunningAirport(page, size);
                                          }, 
                                          onShowSizeChange: (current, size) => {
                                            setPageSize(size);
                                          }, 
                                        }}
                                    />
                {/* </div> */}
            </div>
        </>
    )
}

export default RunningAirport;