import React, { useState } from 'react';
import { SchemaMarkupField as Field } from '@formily/antd';
import { FormBlock, FormLayout, FormTextBox } from '@formily/antd-components';
import styles from '../index.less';
/**
 * @deprecated
 * 已过期，请使用ConditionTableField
 */
export default (props) => {
  const {
    dictionaryMap: { SLA_TARGER_TYPE, COMPARE_TYPE },
    flatTreeData = [],
    title,
    name,
    arrayFieldProps = {},
  } = props;

  const sampleList = flatTreeData.filter(x => x.type === 'SAMPLER');

  return (
    <FormLayout
      labelCol={0}
      wrapperCol={24}
      labelAlign={undefined}
      prefixCls={undefined}
    >
      <FormBlock title={title}>
        <Field
          {...arrayFieldProps}
          name={name}
          type="array"
          x-component="ArrayTable"
          // minItems={2}
          x-component-props={{
            operationsWidth: 100,
            renderMoveUp: () => null,
            renderMoveDown: () => null,
          }}
        >
          <Field type="object">
            <Field
              title="名称"
              name="name"
              type="string"
              x-component="Input"
              x-component-props={{ placeholder: '请输入规则名称', maxLength: 30, }}
              x-rules={[
                {
                  required: true,
                  whitespace: true,
                  message: '请输入规则名称',
                },
              ]}
            />
            <Field
              title="对象"
              name="target"
              type="array"
              x-component="Select"
              x-component-props={{ placeholder: '请选择', mode: 'multiple' }}
              x-rules={[{ required: true, message: '请选择对象' }]}
              enum={[
                {
                  testName: '全部',
                  xpathMd5: 'all',
                },
              ]
                .concat(sampleList)
                .map((x: any) => ({
                  label: x.testName,
                  value: x.xpathMd5,
                }))}
            />
            <Field
              title="规则"
              type="object"
              x-component="block"
              x-component-props={{ className: styles['rule-td'] }}
            >
              <FormTextBox
                text={`%s %s %s 连续出现 %s次`}
                gutter={8}
                name="textBox"
              >
                <Field
                  name="formulaTarget"
                  type="number"
                  x-component="Select"
                  x-component-props={{
                    placeholder: '指标',
                  }}
                  x-rules={[{ required: true, message: '请选择指标' }]}
                  enum={(SLA_TARGER_TYPE || []).map(x => ({ ...x, value: Number(x.value) }))}
                  // x-linkages={[
                  //   // 联动显示单位
                  //   {
                  //     type: 'value:schema',
                  //     target: '.formulaNumber',
                  //     schema: {
                  //       'x-component-props': {
                  //         addonAfter: `{{ {0: 'ms', 1: '', 2: '%', 3: '%', 4: '%', 5: '%'}[$self.value] }}`,
                  //       },
                  //     },
                  //   },
                  // ]}
                />
                <Field
                  name="formulaSymbol"
                  type="number"
                  x-component="Select"
                  x-component-props={{ placeholder: '条件' }}
                  x-rules={[{ required: true, message: '请选择条件' }]}
                  enum={(COMPARE_TYPE || []).map(x => ({ ...x, value: Number(x.value) }))}
                />
                <Field
                  name="formulaNumber"
                  type="number"
                  x-component="NumberPicker"
                  x-component-props={{
                    placeholder: '数值',
                    compact: false,
                    addonAfter: '',
                    min: 0,
                  }}
                  x-rules={[{ required: true, message: '请输入数值' }]}
                />
                <Field
                  name="numberOfIgnore"
                  type="number"
                  x-component="NumberPicker"
                  x-component-props={{ placeholder: '数值', min: 1 }}
                  x-rules={[
                    { required: true, message: '请输入数值' },
                    { format: 'integer', message: '请输入整数' },
                  ]}
                />
              </FormTextBox>
            </Field>
          </Field>
        </Field>
      </FormBlock>
    </FormLayout>
  );
};