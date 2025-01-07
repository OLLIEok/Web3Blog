import React, { useState, useEffect, useRef } from 'react';
import { Input, Tag, Tooltip, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const TagInput = ({ value, onChange, placeholder, tagStyle, maxLength = 20 }) => {
  const [tags, setTags] = useState(value || []);
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [editInputIndex, setEditInputIndex] = useState(-1);
  const [editInputValue, setEditInputValue] = useState('');
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    setTags(value || []);
  }, [value]);

  useEffect(() => {
    if (inputVisible) {
      inputRef.current?.focus();
    }
  }, [inputVisible]);

  useEffect(() => {
    editInputRef.current?.focus();
  }, [editInputValue]);

  const handleInputConfirm = () => {
    if (inputValue && !tags.includes(inputValue)) {
      const newTags = [...tags, inputValue];
      setTags(newTags);
      onChange(newTags);  
    }
    setInputVisible(false);
    setInputValue('');
  };

  const handleEditInputConfirm = () => {
    const newTags = [...tags];
    newTags[editInputIndex] = editInputValue;
    setTags(newTags);
    onChange(newTags);  
    setEditInputIndex(-1);
    setEditInputValue('');
  };

  const tagPlusStyle = {
    height: 25,
    background: '#f0f0f0',
    borderStyle: 'dashed',
  };

  return (
      <Space direction="vertical" size="small">
        <div>
          {tags.map((tag, index) => {
            if (editInputIndex === index) {
              return (
                <Input
                  ref={editInputRef}
                  key={tag}
                  size="small"
                  style={tagStyle}
                  value={editInputValue}
                  onChange={(e) => setEditInputValue(e.target.value)}
                  onBlur={handleEditInputConfirm}
                  onPressEnter={handleEditInputConfirm}
                />
              );
            }
            const isLongTag = tag.length > maxLength;
            const tagElem = (
              <Tag
                key={tag}
                closable
                style={{ userSelect: 'none', ...tagStyle }}
                onClose={() => {
                  const newTags = tags.filter((t) => t !== tag);
                  setTags(newTags);
                  onChange(newTags);  
                }}
              >
                <span
                  onDoubleClick={(e) => {
                    setEditInputIndex(index);
                    setEditInputValue(tag);
                    e.preventDefault();
                  }}
                >
                  {isLongTag ? `${tag.slice(0, maxLength)}...` : tag}
                </span>
              </Tag>
            );
            return isLongTag ? (
              <Tooltip title={tag} key={tag}>
                {tagElem}
              </Tooltip>
            ) : (
              tagElem
            );
          })}
          {inputVisible ? (
            <Input
              ref={inputRef}
              type="text"
              size="small"
              style={tagStyle}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputConfirm}
              onPressEnter={handleInputConfirm}
            />
          ) : (
            <Tag style={tagPlusStyle} icon={<PlusOutlined />} onClick={() => setInputVisible(true)}>
              {placeholder}
            </Tag>
          )}
        </div>
      </Space>
  );
};

export default TagInput;
