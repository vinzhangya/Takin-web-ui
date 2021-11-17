import React, { useEffect, useState, useMemo } from 'react';
import { connect } from 'dva';
import {
  SchemaForm,
  SchemaMarkupField as Field,
  FormButtonGroup,
  FormSpy,
  Submit,
  createAsyncFormActions,
  FormEffectHooks,
  FormPath,
} from '@formily/antd';
import {
  Input,
  Select,
  FormStep,
  FormLayout,
  FormBlock,
  Radio,
  ArrayTable,
  FormTextBox,
} from '@formily/antd-components';
import { Button, message, Spin } from 'antd';
import services from './service';
import TargetMap from './components/TargetMap';
import ConfigMap from './components/ConfigMap';
import ConditionTable from './components/ConditionTable';
import NumberPicker from './components/NumberPicker';
import ValidateCommand from './components/ValidateCommand';
import { getTakinAuthority } from 'src/utils/utils';
import TipTittle from './components/TipTittle';
import { cloneDeep, debounce } from 'lodash';

const { onFieldValueChange$, onFieldInputChange$, onFormMount$ } = FormEffectHooks;

const EditPage = (props) => {
  const actions = useMemo(() => createAsyncFormActions(), []);
  const { dictionaryMap } = props;
  const [businessFlowList, setBusinessFlowList] = useState([]);
  const [flatTreeData, setFlatTreeData] = useState([]);
  const [initialValue, setInitialValue] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /**
   * 获取详情信息
   */
  const getDetailData = async () => {
    const id = props.location.query.id;
    if (id) {
      const {
        data: { success, data },
      } = await services.getSenceDetailV2({ sceneId: id });
      if (success) {
        setInitialValue(data);
      }
    }
  };

  /**
   * 获取业务流程下拉列表
   */
  const getBusinessFlowList = async () => {
    const {
      data: { success, data },
    } = await services.business_activity_flow({});
    if (success) {
      setBusinessFlowList(data);
    }
  };

  /**
   * 根据流程id获取线程树
   * @param flowId
   * @returns
   */
  const getThreadTree = async (flowId) => {
    if (!flowId) {
      return;
    }
    actions.setFieldState('goal', (state) => {
      state.props['x-component-props'].loading = true;
    });
    const {
      data: { success, data },
    } = await services.getThreadTree({
      id: flowId,
    });
    if (success) {
      try {
        const parsedData = JSON.parse(data.scriptJmxNode);
        // setThreadTree(parsedData);
        actions.setFieldState('goal', (state) => {
          state.props['x-component-props'].treeData = parsedData || [];
          state.props['x-component-props'].loading = false;
        });
        actions.setFieldState('config.threadGroupConfigMap', (state) => {
          /**
           * 树结构平铺
           * @param nodes
           * @param parentId
           * @returns
           */
          const result = [];
          const flatTree = (nodes, parentId = '-1', idName = 'id') => {
            if (Array.isArray(nodes) && nodes.length > 0) {
              nodes.forEach((node) => {
                const { children, ...rest } = node;
                result.push({
                  parentId,
                  ...rest,
                });
                flatTree(node.children, node[idName], idName);
              });
              return result;
            }
          };
          const flatTreeData1 = flatTree(parsedData, '-1', 'xpathMd5') || [];
          setFlatTreeData(flatTreeData1);
          state.props['x-component-props'].flatTreeData = flatTreeData1;
        });
      } catch (error) {
        throw error;
      }
    }
  };

  /**
   * 监听表单项数据联动变化
   */
  const formEffect = () => {
    const { setFieldState, dispatch, getFieldState } = actions;
    onFieldValueChange$('.basicInfo.businessFlowId').subscribe((fieldState) => {
      getThreadTree(fieldState.value);
      setFieldState('dataValidation.content', state => {
        state.props['x-component-props'].flowId = fieldState.value;
      });
    });
    onFieldInputChange$('.basicInfo.businessFlowId').subscribe((fieldState) => {
      // 手动变更业务流程时，清空步骤1之前的目标数据
      setFieldState('goal', state => {
        state.value = {};
      });
      // 手动变更业务流程时，清空步骤2线程组的配置数据
      setFieldState('config.threadGroupConfigMap', state => {
        state.initialValue = {};
      });
      // 手动变更业务流程时，清空步骤3之前的终止条件
      setFieldState('destroyMonitoringGoal', state => {
        state.value = [{}];
      });
      // 手动变更业务流程时，清空步骤3之前的告警条件
      setFieldState('warnMonitoringGoal', state => {
        state.value = undefined;
      });
    });

    onFieldValueChange$('.goal').subscribe((fieldState) => {
      setFieldState('config.threadGroupConfigMap', (state) => {
        state.props['x-component-props'].targetValue = fieldState.value;
      });
    });

    // 联动显示规则表格中的的单位
    const getUnitConfig = (val) => {
      switch (val) {
        case '0':
          return {
            compact: true,
            addonAfter: (
              <Button disabled style={{ paddingLeft: 4, paddingRight: 4 }}>
                ms
              </Button>
            ),
            max: undefined,
          };
        case '1':
          return {
            addonAfter: undefined,
            max: undefined,
          };
        default:
          return {
            compact: true,
            addonAfter: (
              <Button disabled style={{ paddingLeft: 4, paddingRight: 4 }}>
                %
              </Button>
            ),
            max: 100,
          };
      }
    };
    const changeUint = (fieldState) => {
      const sourcePath = FormPath.parse(fieldState.path);
      setFieldState(
        sourcePath.slice(0, sourcePath.length - 1).concat('.formulaNumber'),
        (state) => {
          state.props['x-component-props'] = {
            ...state.props['x-component-props'],
            ...getUnitConfig(fieldState.value),
          };
        }
      );
    };
    onFieldValueChange$('destroyMonitoringGoal.*.formulaTarget').subscribe(
      changeUint
    );

    onFieldValueChange$('warnMonitoringGoal.*.formulaTarget').subscribe(
      changeUint
    );

    if (getTakinAuthority() === 'true') {
      // 获取建议pod数
      onFieldValueChange$(
        // '*(goal.*.tps, config.threadGroupConfigMap.*.threadNum)'
        'config.threadGroupConfigMap.*.threadNum'
      ).subscribe((fieldState) => {
        // 获取建议pod数
        // debounce(() => {
        getFieldState('config.threadGroupConfigMap', (configState) => {
          const configMap = cloneDeep(configState.value);
          getFieldState('goal', async (state) => {
            Object.keys(configMap || {}).forEach((groupKey) => {
              let sum = 0;
              const flatTreeData2 =
                configState.props['x-component-props'].flatTreeData;

              // 递归tps求和
              const getTpsSum = (valueMap, parentId) => {
                flatTreeData2
                  .filter((x) => x.parentId === parentId)
                  .forEach((x) => {
                    sum += valueMap?.[x.xpathMd5]?.tps || 0;
                    getTpsSum(valueMap, x.xpathMd5);
                  });
                return sum;
              };
              configMap[groupKey].tpsSum = getTpsSum(
                state.value,
                groupKey
              );
            });
            const {
              data: { success, data },
            } = await services.querySuggestPodNum(configMap);
            if (success) {
              setFieldState('config.podNum', podState => {
                podState.props['x-component-props'].addonAfter = <Button>建议Pod数: {data?.min}-{data?.max}</Button>;
              });
            }
          });
        });
        // }, 200)
      });
    }
  };

  /**
   * 提交表单
   * @param values
   */
  const onSubmit = async (values) => {
    setSaving(true);
    const {
      data: { success, data },
    } = await services[props.location.query.id ? 'updateSenceV2' : 'createSenceV2'](values);
    if (success) {
      message.success('操作成功');
      props.history.goBack();
    }
    setSaving(false);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([getBusinessFlowList(), getDetailData()]).then(() => {
      setLoading(false);
    });
  }, []);

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 20 }}>
        <div
          style={{
            fontSize: 20,
            borderBottom: '1px solid #ddd',
            paddingBottom: 10,
          }}
        >
          压测场景配置
        </div>
        <SchemaForm
          actions={actions}
          initialValues={initialValue}
          components={{
            Input,
            Select,
            NumberPicker,
            TargetMap,
            ConfigMap,
            ValidateCommand,
            ArrayTable,
            FormBlock,
            FormTextBox,
            Radio,
            RadioGroup: Radio.Group,
          }}
          onSubmit={onSubmit}
          effects={() => {
            formEffect();
          }}
        >
          <FormStep
            style={{ width: 600, margin: '40px auto' }}
            size="small"
            labelPlacement="vertical"
            // current={2}
            dataSource={[
              { title: '压测目标', name: 'step-1' },
              { title: '施压配置', name: 'step-2' },
              { title: 'SLA配置', name: 'step-3' },
              { title: '数据验证设置', name: 'step-4' },
            ]}
          />
          <FormLayout
            name="step-1"
            labelCol={4}
            wrapperCol={10}
            prefixCls={undefined}
            labelAlign={undefined}
          >
            <Field name="basicInfo" type="object">
              <Field
                name="name"
                type="string"
                x-component="Input"
                x-component-props={{
                  placeholder: '请输入',
                  maxLength: 30,
                }}
                title="压测场景名称"
                x-rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请输入压测场景名称',
                  },
                ]}
                required
              />
              <Field
                name="businessFlowId"
                type="number"
                x-component="Select"
                x-component-props={{
                  placeholder: '请选择',
                }}
                x-rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请选择业务流程',
                  },
                ]}
                title="业务流程"
                required
                enum={businessFlowList.map((x) => ({
                  label: x.sceneName,
                  value: x.id,
                }))}
              />
            </Field>
            <Field
              type="object"
              name="goal"
              x-component="TargetMap"
              x-component-props={{
                treeData: [],
                loading: false,
              }}
            />
          </FormLayout>

          <FormLayout
            name="step-2"
            labelCol={4}
            wrapperCol={10}
            labelAlign={undefined}
            prefixCls={undefined}
          >
            <Field type="object" name="config">
              <Field
                name="duration"
                type="number"
                x-component="NumberPicker"
                x-component-props={{
                  placeholder: '请输入',
                  style: {
                    width: '100%',
                  },
                  min: 1,
                  precision: 0,
                  addonAfter: <Button>分</Button>,
                }}
                title="压测时长"
                minimum={1}
                x-rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请输入压测时长',
                  },
                ]}
                required
              />
              <FormLayout name="pannelLayout" labelCol={8} wrapperCol={16}>
                <Field
                  name="threadGroupConfigMap"
                  x-component="ConfigMap"
                  x-component-props={{
                    flatTreeData: [],
                    targetValue: {},
                  }}
                />
              </FormLayout>

              <Field
                name="podNum"
                type="number"
                x-component="NumberPicker"
                x-component-props={{
                  placeholder: '请输入',
                  style: {
                    width: '100%',
                  },
                  min: 1,
                  default: 1,
                  addonAfter: <Button>建议Pod数: -</Button>,
                  disabled: getTakinAuthority() !== 'true',
                }}
                title={
                  <TipTittle tips="指定压力机pod数量，可参考建议值范围。指定数量过高可能导致硬件资源无法支持；指定数量过低可能导致发起压力达不到要求">
                    指定Pod数
                  </TipTittle>
                }
                x-rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请输入Pod数',
                  },
                ]}
                required
                default={1}
              />
            </Field>
          </FormLayout>

          <FormLayout
            name="step-3"
            labelCol={4}
            wrapperCol={10}
            labelAlign={undefined}
            prefixCls={undefined}
          >
            <ConditionTable
              dictionaryMap={dictionaryMap}
              flatTreeData={flatTreeData}
              name="destroyMonitoringGoal"
              title={
                <span style={{ fontSize: 16 }}>
                  终止条件
                  <span style={{ color: '#f7917a', marginLeft: 8 }}>
                    为保证安全压测，所有业务活动需配置含「RT」和「成功率」的终止条件
                  </span>
                </span>}
              arrayFieldProps={{
                default: [{}],
                minItems: 1,
                // 'x-rules': [{
                //   validator: (val) => {
                //     if (!(val || []).some((x) => x.formulaTarget === '0')) {
                //       return '请至少设置1条包含RT的终止条件';
                //     }
                //     if (!(val || []).some((x) => x.formulaTarget === '2')) {
                //       return '请至少设置1条包含成功率的终止条件';
                //     }
                //   },
                // }],
              }}
            />
            <ConditionTable
              dictionaryMap={dictionaryMap}
              flatTreeData={flatTreeData}
              name="warnMonitoringGoal"
              title={<span style={{ fontSize: 16 }}>告警条件</span>}
              arrayFieldProps={{
                default: [],
              }}
            />
          </FormLayout>

          <FormLayout
            name="step-4"
            labelCol={4}
            wrapperCol={10}
            labelAlign={undefined}
            prefixCls={undefined}
          >
            <Field name="dataValidation" type="object">
              <Field
                name="timeInterval"
                type="number"
                x-component="NumberPicker"
                x-component-props={{
                  placeholder: '请输入',
                  style: {
                    width: '100%',
                  },
                  min: 1,
                  max: 59,
                  default: 1,
                  addonAfter: <Button>分</Button>,
                }}
                title={
                  <TipTittle
                    tips="时间间隔指数据验证命令循环执行的时间，时间间隔越短，对数据库性能损耗越高，最大不得超过压测总时长。

                根据验证命令实际执行情况，实际间隔时间可能会有少许出入，属于正常情况。"
                  >
                    时间间隔
                  </TipTittle>
                }
                x-rules={[
                  {
                    required: true,
                    whitespace: true,
                    message: '请输入时间间隔',
                  },
                ]}
                required
              />
              <Field
                name="content"
                title="验证命令"
                x-component="ValidateCommand"
                x-component-props={{
                  flowId: '',
                }}
              />
            </Field>
          </FormLayout>

          <FormSpy
            selector={FormStep.ON_FORM_STEP_CURRENT_CHANGE}
            initialState={{
              step: { value: 0 },
            }}
            reducer={(state, action) => {
              switch (action.type) {
                case FormStep.ON_FORM_STEP_CURRENT_CHANGE:
                  return { ...state, step: action.payload };
                default:
                  return { step: { value: 0 } };
              }
            }}
          >
            {({ state }) => {
              const isLastStep = state.step.value === 3;
              return (
                <FormButtonGroup align="center" sticky>
                  <Button
                    disabled={state.step.value === 0}
                    onClick={() => {
                      actions.dispatch(FormStep.ON_FORM_STEP_PREVIOUS);
                    }}
                  >
                    上一步
                  </Button>
                  <Button
                    type={isLastStep ? 'primary' : undefined}
                    loading={saving}
                    onClick={() => {
                      if (isLastStep) {
                        actions.submit();
                      } else {
                        actions.dispatch(FormStep.ON_FORM_STEP_NEXT);
                      }
                    }}
                  >
                    {isLastStep ? '保存' : '下一步'}
                  </Button>
                  {/* <Button onClick={() => actions.getFormState(state => console.log(state.values))}>test</Button> */}
                  {/* <Reset>重置</Reset>​ */}
                </FormButtonGroup>
              );
            }}
          </FormSpy>
          {/* <Submit/> */}
        </SchemaForm>
      </div>
    </Spin>
  );
};

export default connect(({ common }) => ({ ...common }))(EditPage);
