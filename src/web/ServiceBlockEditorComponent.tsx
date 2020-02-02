import React, {ChangeEvent, Component} from "react";
import _ from "lodash";
import {action, observable, toJS} from "mobx";
import {observer} from "mobx-react";

import {
    Type,
    BlockMetadata,
    BlockServiceSpec,
    BlockType,
    TargetConfigProps,
    EntityConfigProps,
    hasEntityReference,
    SchemaEntity,
} from "@blockware/ui-web-types";

import {
    toClass,
} from "@blockware/ui-web-utils";

import {
    FormRow,
    TabContainer,
    TabPage,
    SidePanel,
    PanelAlignment,
    PanelSize,
    EntityForm,
    EntityFormModel,
    FormButtons,
    FormContainer
} from "@blockware/ui-web-components";

import {
    BlockTargetProvider
} from "@blockware/ui-web-context";


import './ServiceBlockEditorComponent.less';

@observer
class ServiceBlockComponent extends Component<EntityConfigProps<BlockMetadata, BlockServiceSpec>, any> {
    
    @observable
    private readonly metadata:BlockMetadata;

    @observable
    private readonly spec:BlockServiceSpec;

    @observable
    private currentEntity?:EntityFormModel;

    @observable
    private originalEntity?:SchemaEntity;

    sidePanel: SidePanel | null = null;

    constructor(props:EntityConfigProps){
        super(props);

        this.metadata = !_.isEmpty(this.props.metadata) ? _.cloneDeep(this.props.metadata) : {
            name: '',
            version: '0.0.1'
        };


        this.spec = !_.isEmpty(this.props.spec) ? _.cloneDeep(this.props.spec) : {
            target: {
                kind: '',
                options: {},
                
            },type:BlockType.SERVICE
        };

        if (!this.spec.entities) {
            this.spec.entities = [];
        }
    }
    
    private invokeDataChanged() {
        this.props.onDataChanged(toJS(this.metadata), toJS(this.spec));
    }

    @action
    private handleTargetConfigurationChange(config:Object) {
        this.spec.target.options = config;

        this.invokeDataChanged();
    }

    @action
    private handleMetaDataChanged(evt:ChangeEvent<HTMLInputElement>) {
        this.metadata[evt.target.name] = evt.target.value;

        this.invokeDataChanged();
    }

    @action
    private handleTargetKindChanged(kind:string) {
        if (this.spec.target.kind === kind) {
            return;
        }

        this.spec.target.kind = kind;
        this.spec.target.options = {};

        this.invokeDataChanged();
    }


    @action
    private handleEntityFormClosed = () => {
        this.currentEntity = undefined;
        this.originalEntity = undefined;
    };

    @action
    private handleEditEntity(entity:SchemaEntity) {
        if (!this.sidePanel) {
            return;
        }

        this.currentEntity = new EntityFormModel(entity);
        this.originalEntity = entity;
        this.sidePanel.open();
    }

    @action
    private handleCreateEntity() {
        if (!this.sidePanel) {
            return;
        }
        this.currentEntity = new EntityFormModel();
        this.originalEntity = this.currentEntity.getData();
        this.sidePanel.open();
    }

    @action
    private handleRemoveEntity(entity:SchemaEntity) {
        if (!this.spec.entities) {
            return;
        }

        //Check if entity is being used by any of the resources
        if (hasEntityReference(this.spec, entity.name)) {
            //If it is - prevent deletion. The user must remove the usages first
            return;
        }

        _.pull(this.spec.entities, entity);

        this.invokeDataChanged();
    }

    @action
    private handleEntityUpdated = (entity:EntityFormModel) => {
        this.currentEntity = entity;
    };

    @action
    private handleEntitySaved = () => {
        if (!this.currentEntity ||
            !this.originalEntity ||
            !this.spec.entities) {
            return;
        }

        const otherEntity = _.find(this.spec.entities, (entity) => {
            return (entity !== this.originalEntity &&
                this.currentEntity &&
                this.currentEntity.name === entity.name);
        });

        if (otherEntity) {
            //Other entity with same name exists - invalid;
            return;
        }

        Object.assign(this.originalEntity, this.currentEntity.getData());

        if (this.spec.entities.indexOf(this.originalEntity) === -1) {
            //Creating entity
            this.spec.entities.push(this.originalEntity);
        }

        this.invokeDataChanged();

        this.sidePanel && this.sidePanel.close();
    };

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
                <h3>Target configuration</h3>
                <TargetConfigComponent
                    value={this.spec.target.options ? toJS(this.spec.target.options) : {}}
                    onOptionsChanged={(config:Object) => { this.handleTargetConfigurationChange(config) }} />
            </div>
        );
    }

    private renderForm() {
        return (
            <>
                <FormRow label="Name"
                         help="Specifiy the name of your block."
                         validation={'required'}>
                    <input type="text" placeholder="E.g. My Block Name"
                           name="name"
                           autoComplete={"off"}
                           value={this.metadata.name}
                           onChange={(evt) => {this.handleMetaDataChanged(evt)}} />
                </FormRow>

                <FormRow label={"Version"}
                         help="The version is automatically calculated for you using semantic versioning."
                         validation={'required'}>
                    <input type="text" disabled
                           name="version"
                           value={this.metadata.version}
                           onChange={(evt) => {this.handleMetaDataChanged(evt)}} />
                </FormRow>

                <FormRow label={"Target"}
                         help="This tells the code generation process which target programming language to use."
                         validation={'required'}>
                    <select name="targetKind"
                            value={this.spec.target.kind.toLowerCase()}
                            onChange={(evt) => {this.handleTargetKindChanged(evt.target.value)}}>

                        <option value="">Select target...</option>
                        {BlockTargetProvider.list(this.props.kind).map((targetConfig, ix) => {
                            return <option key={ix} value={targetConfig.kind.toLowerCase()}>{targetConfig.name}</option>
                        })}
                    </select>
                </FormRow>

                {this.renderTargetConfig()}
            </>
        )
    }

    private renderEntities() {
        const entities = this.spec.entities || [];
        return (
            <div className={'entities-list'}>
                <ul>
                {
                    entities.map((entity,ix) => {

                        const inUse = hasEntityReference(this.spec, entity.name);

                        const className = toClass({
                            'entity': true,
                            'used':inUse
                        });
                        return (
                            <li key={ix} className={className}>
                                <span className={'name'}>{entity.name}</span>

                                {inUse &&
                                    <span className={'note'}>( In use )</span>
                                }

                                <span className={'actions'}>
                                    <button type={'button'}
                                            onClick={() => this.handleEditEntity(entity)}
                                            className={'edit'} >
                                        <i className={'fa fa-pencil'} />
                                    </button>

                                    {!inUse &&
                                        <button type={'button'}
                                                onClick={() => this.handleRemoveEntity(entity)}
                                                className={'remove'}>
                                            <i className={'fa fa-times'} />
                                        </button>
                                    }
                                </span>
                            </li>
                        );
                    })
                }
                </ul>
                <button type={'button'}
                        onClick={() => this.handleCreateEntity()}
                        className={'create'} >
                    <i className={'fa fa-plus'} />
                    <span>Create new entity</span>
                </button>
            </div>

        )
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

                <SidePanel size={PanelSize.small}
                           ref={(ref) => this.sidePanel = ref}
                           side={PanelAlignment.right}
                           onClose={this.handleEntityFormClosed}
                           title={'Edit entity'}>
                    <FormContainer onSubmit={this.handleEntitySaved}>
                        {this.currentEntity &&
                            <EntityForm name={'block-entity'}
                                        entity={this.currentEntity}
                                        onChange={this.handleEntityUpdated}/>
                        }

                        <FormButtons>
                            <button type={'button'} className={'cancel'} onClick={() => {this.sidePanel && this.sidePanel.close()}}>
                                Cancel
                            </button>
                            <button type={'submit'} className={'action primary'}>
                                Save
                            </button>
                        </FormButtons>
                    </FormContainer>
                </SidePanel>
            </div>
        )
    }
}

export default ServiceBlockComponent;