import React, { useState, useEffect, useContext } from 'react';
import {
  Alert,
  Divider,
  Icon,
  Button,
  Tooltip,
  Modal,
  Radio,
  message,
  Upload,
} from 'antd';
import { PrepareContext } from '../indexPage';
import DataIsolateGuide from './DataIsolateGuide';
import DataSourceMode from './DataSourceMode';
import AppMode from './AppMode';
import EditDataSource from '../modals/EditDataSource';
import service from '../service';
import styles from '../index.less';
import { getUrl } from 'src/utils/request';

export default (props) => {
  const [showGuide, setShowGuide] = useState(false);
  const [mode, setMode] = useState(0);
  const [editedDataSource, setEditedDataSource] = useState(undefined);
  const { prepareState, setPrepareState } = useContext(PrepareContext);
  const [uploading, setUploading] = useState(false);
  const [isolateListRefreshKey, setIsolateListRefreshKey] = useState(0);

  const setIsolatePlan = () => {
    let val;
    Modal.confirm({
      className: styles['modal-tight'],
      width: 640,
      icon: null,
      content: (
        <div>
          <div
            style={{
              fontSize: 20,
              color: 'var(--Netural-990, #25282A)',
              borderBottom: '1px solid var(--Netural-100, #EEF0F2)',
              paddingBottom: 30,
              lineHeight: 1,
            }}
          >
            设置隔离方案
          </div>
          <div style={{ padding: 24 }}>
            <Radio.Group defaultValue={val} onChange={(value) => (val = value)}>
              <Radio value={1}>影子库</Radio>
              <Radio value={2}>影子表</Radio>
              <Radio value={3}>影子库/表</Radio>
            </Radio.Group>
          </div>
        </div>
      ),
      okText: '确认设置',
      onOk: async () => {
        if (!val) {
          message.warn('请选择隔离方案');
          return Promise.reject();
        }
        // TODO 变更隔离方式
      },
    });
  };

  if (showGuide) {
    return <DataIsolateGuide setIsolatePlan={setIsolatePlan} />;
  }

  const activeModeSwitchStyle = {
    backgroundColor: 'var(--Netural-100, #EEF0F2)',
  };

  const uploadFile = async ({ file }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceId', prepareState.currentLink.id);

    const {
      data: { success },
    } = await service.importConfigFile(formData).finally(() => {
      setUploading(false);
    });
    if (success) {
      message.success('操作成功');
      setIsolateListRefreshKey(isolateListRefreshKey + 1);
    }
  };

  const downLoadConfigFile = () => {
    window.location.href = getUrl(
      `/pressureResource/ds/export?resourceId=${prepareState.currentLink.id}`
    );
  };

  return (
    <>
      <div
        style={{
          padding: '16px 32px',
          borderBottom: '1px solid #F7F8FA',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              padding: 4,
              border: '1px solid var(--Netural-100, #EEF0F2)',
              borderRadius: 100,
              display: 'inline-block',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                lineHeight: '32px',
                padding: '0 16px',
                borderRadius: 100,
                color: 'var(--Netural/800, #5A5E62)',
                fontWeight: 500,
                cursor: 'pointer',
                ...(mode === 0 ? activeModeSwitchStyle : {}),
              }}
              onClick={() => setMode(0)}
            >
              数据源模式
            </div>
            <div
              style={{
                display: 'inline-block',
                lineHeight: '32px',
                padding: '0 16px',
                borderRadius: 100,
                color: 'var(--Netural/800, #5A5E62)',
                fontWeight: 500,
                cursor: 'pointer',
                ...(mode === 1 ? activeModeSwitchStyle : {}),
              }}
              onClick={() => setMode(1)}
            >
              应用模式
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div>
            隔离方式：影子库
            <a style={{ marginLeft: 16 }} onClick={setIsolatePlan}>
              设置
            </a>
          </div>
          <Divider type="vertical" style={{ height: 24, margin: '0 24px' }} />
          <Tooltip title="333">
            <Icon type="info-circle" style={{ cursor: 'pointer' }} />
          </Tooltip>
          <Button
            style={{ marginLeft: 24 }}
            onClick={() => setEditedDataSource({})}
          >
            新增数据源
          </Button>
          <Upload
            accept=".xlsx,.csv,.xls"
            showUploadList={false}
            customRequest={uploadFile}
          >
            <Button style={{ marginLeft: 24 }} loading={uploading}>
              导入隔离配置
            </Button>
          </Upload>
          <Button
            type="primary"
            style={{ marginLeft: 24 }}
            onClick={downLoadConfigFile}
          >
            导出待配置项
          </Button>
        </div>
      </div>
      {mode === 0 && (
        <DataSourceMode
          setEditedDataSource={setEditedDataSource}
          isolateListRefreshKey={isolateListRefreshKey}
        />
      )}
      {mode === 1 && <AppMode isolateListRefreshKey={isolateListRefreshKey} />}
      <EditDataSource
        detail={editedDataSource}
        okCallback={() => {
          // TODO 刷新列表
          setEditedDataSource(undefined);
        }}
        cancelCallback={() => setEditedDataSource(undefined)}
      />
    </>
  );
};
