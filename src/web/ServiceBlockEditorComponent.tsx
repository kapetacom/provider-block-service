import React, {Component} from "react";
import _ from "lodash";
import {action, makeObservable, observable, toJS} from "mobx";
import {observer} from "mobx-react";

import {
    Type,
    BlockMetadata,
    BlockServiceSpec,
    BlockType,
    TargetConfigProps,
    EntityConfigProps,
    SchemaProperties
} from "@blockware/ui-web-types";

import {
    TabContainer,
    TabPage,
    DropdownInput,
    SingleLineInput,
    DataTypeEditor,
    DSLEntityType,
    DSLDataType,
    DSLDataTypeProperty
} from "@blockware/ui-web-components";

import {
    BlockTargetProvider
} from "@blockware/ui-web-context";


import './ServiceBlockEditorComponent.less';


function fromSchema(properties:SchemaProperties):DSLDataTypeProperty[] {
    return Object.entries(properties).map(([name, value]):DSLDataTypeProperty => {
        // @ts-ignore
        const stringType = value.type && value.type.$ref ? value.type.$ref : value.type

        if (stringType === 'array') {
            return {
                name,
                type: value.items?.type,
                list: true,
                properties: value.items?.properties ? fromSchema(value.items?.properties) : null
            }
        }

        return {
            name,
            type: stringType,
            list: stringType.endsWith('[]'),
            properties: value.properties ? fromSchema(value.properties) : null
        }
    });
}

function toSchema(properties:DSLDataTypeProperty[]):SchemaProperties {
    const out = {};

    properties.forEach(property => {

        let type = property.type;
        if (property.type.substring(0,1).toUpperCase() === property.type.substring(0,1)) {
            //Poor mans check if built in type.
            //TODO: Fix - either by not having $ref or by returning it explicitly
            type = {$ref: type}
        }

        if (property.list) {
            out[property.name] = {
                type: 'array',
                items: {
                    type,
                    properties: property.properties ? toSchema(property.properties) : null
                }
            }
        } else {
            out[property.name] = {
                type,
                properties: property.properties ? toSchema(property.properties) : null
            }
        }

    })

    return out;
}

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
            version: '0.0.1'
        };


        this.spec = !_.isEmpty(this.props.spec) ? _.cloneDeep(this.props.spec) : {
            target: {
                kind: '',
                options: {},

            }, type: BlockType.SERVICE
        };

        if (!this.spec.entities) {
            this.spec.entities = [];
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
        BlockTargetProvider.list(this.props.kind).forEach((targetConfig) => options[targetConfig.kind.toLowerCase()] = targetConfig.name);
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

                <SingleLineInput
                    name={"name"}
                    value={this.metadata.name}
                    label={"Name"}
                    validation={['required']}
                    help={"Specify the name of your block."}
                    onChange={(inputName, userInput) => this.handleMetaDataChanged(inputName, userInput)}>
                </SingleLineInput>

                <SingleLineInput
                    name={"version"}
                    value={this.metadata.version}
                    label={"Version"}
                    validation={['required']}
                    help={"The version is automatically calculated for you using semantic versioning."}
                    disabled={true}
                    onChange={(inputName, userInput) => this.handleMetaDataChanged(inputName, userInput)}>
                </SingleLineInput>

                <DropdownInput
                    name={"targetKind"}
                    value={this.spec.target.kind.toLowerCase()}
                    label={"Target"}
                    validation={['required']}
                    help={"This tells the code generation process which target programming language to use."}
                    onChange={this.handleTargetKindChanged}
                    options={this.createDropdownOptions()}
                >
                </DropdownInput>

                {this.renderTargetConfig()}
            </>
        )
    }

    private renderEntities() {
        const entities = this.spec.entities || [];

        const result = {
            code: '',
            entities: entities.map((entity):DSLDataType => {
                return {
                    type: DSLEntityType.DATATYPE,
                    name: entity.name,
                    properties: fromSchema(entity.properties)
                }
            })
        };

        return (
            <div className={'entity-editor'}>
                <DataTypeEditor value={result} onChange={(result) => {
                    result.entities && this.setEntities(result.entities);
                }} />
            </div>
        )
    }

    @action
    private setEntities(results: DSLDataType[]) {
        const newEntities = results.map((entity:DSLDataType) => {
            return {
                name: entity.name,
                properties: toSchema(entity.properties)
            }
        });

        if (!_.isEqual(this.spec.entities, newEntities)) {
            this.spec.entities = newEntities
            this.invokeDataChanged();
        }
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