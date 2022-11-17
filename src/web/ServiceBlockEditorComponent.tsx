import React, {Component} from "react";
import _ from "lodash";
import {action, makeObservable, observable, toJS} from "mobx";
import {observer} from "mobx-react";

import type {
    Type,
    BlockMetadata,
    BlockServiceSpec,
    TargetConfigProps,
    EntityConfigProps
} from "@blockware/ui-web-types";

import {
    BlockType
} from "@blockware/ui-web-types";

import {
    TabContainer,
    TabPage,
    DataTypeEditor,
    DSLDataType,
    DSLConverters,
    DSL_LANGUAGE_ID, DSLEntity, FormSelect
} from "@blockware/ui-web-components";

import {
    BlockTargetProvider
} from "@blockware/ui-web-context";


import './ServiceBlockEditorComponent.less';



@observer
class ServiceBlockComponent extends Component<EntityConfigProps<BlockMetadata, BlockServiceSpec>, any> {

    @observable
    private readonly metadata: BlockMetadata;

    @observable
    private readonly spec: BlockServiceSpec;

    constructor(props: EntityConfigProps) {
        super(props);
        makeObservable(this);

        this.metadata = !_.isEmpty(this.props.metadata) ? _.cloneDeep(this.props.metadata) : {
            name: '',
            title: ''
        };


        this.spec = !_.isEmpty(this.props.spec) ? _.cloneDeep(this.props.spec) : {
            target: {
                kind: '',
                options: {},

            }, type: BlockType.SERVICE
        };

        if (!this.spec.entities) {
            this.spec.entities = {
                types: [],
                source: {
                    type: DSL_LANGUAGE_ID,
                    value: ''
                }
            };
        }
    }

    private invokeDataChanged() {
        this.props.onDataChanged(toJS(this.metadata), toJS(this.spec));
    }

    @action
    private handleTargetConfigurationChange(config: Object) {
        this.spec.target.options = config;

        this.invokeDataChanged();
    }

    @action
    private handleMetaDataChanged(inputName: string, userInput: string) {
        this.metadata[inputName] = userInput;

        this.invokeDataChanged();
    }

    @action
    private createDropdownOptions() {
        let options: { [key: string]: string } = {};
        BlockTargetProvider.list(this.props.kind).forEach((targetConfig) => options[targetConfig.kind.toLowerCase()] = targetConfig.title || targetConfig.kind);
        return options;
    }

    @action
    private handleTargetKindChanged = (name: string, value: string) => {
        if (this.spec.target.kind === value) {
            return;
        }

        this.spec.target.kind = value;
        this.spec.target.options = {};

        this.invokeDataChanged();
    }


    private renderTargetConfig() {
        let TargetConfigComponent: Type<Component<TargetConfigProps, any>> | null = null;
        if (this.spec.target.kind) {
            const currentTarget = BlockTargetProvider.get(this.spec.target.kind, this.props.kind);

            if (currentTarget && currentTarget.componentType) {
                TargetConfigComponent = currentTarget.componentType;
            }
        }

        if (!TargetConfigComponent) {
            return <div></div>;
        }

        return (
            <div className="form-section">
                <span>Target configuration</span>
                <TargetConfigComponent
                    value={this.spec.target.options ? toJS(this.spec.target.options) : {}}
                    onOptionsChanged={(config: Object) => {
                        this.handleTargetConfigurationChange(config)
                    }}/>
            </div>
        );
    }

    private renderForm() {
        return (
            <>

                <FormSelect
                    name={"targetKind"}
                    value={this.spec.target.kind.toLowerCase()}
                    label={"Target"}
                    validation={['required']}
                    help={"This tells the code generation process which target programming language to use."}
                    onChange={this.handleTargetKindChanged}
                    options={this.createDropdownOptions()}
                />

                {this.renderTargetConfig()}
            </>
        )
    }

    private renderEntities() {
        const entities = this.spec.entities;

        const result = {
            code: entities?.source?.value || '',
            entities: entities?.types?.map ? entities?.types?.map(DSLConverters.fromSchemaEntity) : []
        };

        return (
            <div className={'entity-editor'}>
                <DataTypeEditor value={result} onChange={(result) => {
                    result.entities && this.setEntities(result.code, result.entities);
                }} />
            </div>
        )
    }

    @action
    private setEntities(code:string, results: DSLEntity[]) {
        const types = results.map(DSLConverters.toSchemaEntity);
        this.spec.entities = {
            types,
            source: {
                type: DSL_LANGUAGE_ID,
                value: code
            }
        };
        this.invokeDataChanged();
    }

    render() {

        return (
            <div className={'service-block-config'}>
                <TabContainer defaultTab={'general'}>
                    <TabPage id={'general'} title={'General'}>
                        {this.renderForm()}
                    </TabPage>

                    {!this.props.creating &&
                        <TabPage id={'entities'} title={'Entities'}>
                            {this.renderEntities()}
                        </TabPage>
                    }

                </TabContainer>

            </div>
        )
    }
}

export default ServiceBlockComponent;