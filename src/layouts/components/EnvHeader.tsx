import React, { useState, useEffect } from 'react';
import { Dropdown, Menu, Icon, Button } from 'antd';
import { getTakinTenantAuthority } from 'src/utils/utils';
import tenantCode from './service';
import _ from 'lodash';
interface Props { }
let path = '';
const EnvHeader: React.FC<Props> = (props) => {
  const [envList, setEnvList] = useState([]);
  const [tenantList, setTenantList] = useState([]);
  const [desc, setDesc] = useState('');

  useEffect(() => {
    if (getTakinTenantAuthority() === 'true') {
      queryTenantList();
    }
  }, []);

  const queryTenantList = async () => {
    const {
      data: { success, data }
    } = await tenantCode.tenant({
      tenantCode: localStorage.getItem('tenant-code')
    });
    if (success) {
      setTenantList(data);
      const indexs = _.findIndex(data, ['tenantName', localStorage.getItem('tenant-code')]);
      setEnvList(data[indexs]?.envs);
      const arr = data[indexs]?.envs.filter(item => {
        if (item.isDefault) {
          return item;
        }
      });
      if (localStorage.getItem('env-code') === null) {
        localStorage.setItem('env-code', arr[indexs]?.envCode);
        setDesc(arr[indexs]?.desc);
      } else {
        const ind = _.findIndex(data[indexs].envs, ['envCode', localStorage.getItem('env-code')]);
        setDesc(data[indexs].envs[ind]?.desc);
      }
    }
  };

  function getPath(lists) {
    if (lists.length === 0) {
      return;
    }
    if (lists[0].type === 'Item') {
      path = lists[0].path;
    }
    [lists[0]].forEach(list => {
      if (list.children) {
        getPath(list.children);
      }
    });
    return path;
  }

  const changeTenant = async (code) => {
    const {
      data: { success, data }
    } = await tenantCode.tenantSwitch({
      targetTenantCode: code
    });
    if (success) {
      localStorage.setItem('tenant-code', code);
      setEnvList(data.envs);
      const arr = data.envs.filter(item => {
        if (item.isDefault) {
          return item;
        }
      });
      localStorage.setItem('env-code', arr[0]?.envCode);
      setDesc(arr[0]?.desc);
      const menu = JSON.parse(localStorage.getItem('trowebUserMenu'));
      window.location.href = `?key=${localStorage.getItem('tenant-code')}#${getPath(menu)}`;
    }
  };

  const changeCode = async (code, descs) => {
    const {
      data: { success, data }
    } = await tenantCode.envSwitch({
      targetEnvCode: code
    });
    if (success) {
      setDesc(descs);
      localStorage.setItem('env-code', code);
      const menu = JSON.parse(localStorage.getItem('trowebUserMenu'));
      window.location.href = `?key=${localStorage.getItem('tenant-code')}#${getPath(menu)}`;
      location.reload();
    }
  };
  const index = _.findIndex(envList, ['envCode', localStorage.getItem('env-code')]);
  return (
    <div
      style={{
        lineHeight: '32px',
        padding: '0 8px',
        marginTop: 8,
        display: getTakinTenantAuthority() === 'false' ? 'none' : 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <span style={{ marginRight: 16, color: '#D0D5DE' }}>
        {desc}
      </span>
      <Button.Group>
        <Dropdown
          overlay={
            <Menu>
              {tenantList.map((x) => (
                <Menu.Item
                  key={x.tenantId}
                  onClick={() => changeTenant(x.tenantCode)}
                >
                  {x.tenantName}
                </Menu.Item>
              ))}
            </Menu>
          }
        >
          <Button type="primary">
            租户：
            {localStorage.getItem('tenant-code')}
            <Icon type="down" />
          </Button>
        </Dropdown>
        <Dropdown
          overlay={
            <Menu>
              {envList.map((x, ind) => (
                <Menu.Item
                  key={ind}
                  onClick={() => changeCode(x.envCode, x.desc)}
                >
                  {x.envName}
                </Menu.Item>
              ))}
            </Menu>
          }
        >
          <Button type="primary">
            环境：
            {envList[index]?.envName}
            <Icon type="down" />
          </Button>
        </Dropdown>
      </Button.Group>
    </div>
  );
};

export default EnvHeader;
