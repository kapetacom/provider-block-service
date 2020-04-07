import React, {Component} from "react";
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
    SchemaEntity
} from "@blockware/ui-web-types";

import {
    TabContainer,
    TabPage,
    SidePanel,
    PanelAlignment,
    PanelSize,
    EntityForm,
    EntityList,
    EntityFormModel,
    FormButtons,
    FormContainer,
    DropdownInput,
    SingleLineInput
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

    @observable
    blockTargetKind: string= this.blockTargetKinds()[0].kind.toLowerCase();


    constructor(props:EntityConfigProps){
        super(props);

        this.metadata = !_.isEmpty(this.props.metadata) ? _.cloneDeep(this.props.metadata) : {
            name: '',
            version: '0.0.1'
        };


        this.spec = !_.isEmpty(this.props.spec) ? _.cloneDeep(this.props.spec) : {
            target: {
                kind: this.blockTargetKinds()[0].kind.toLowerCase(),
                options: {},
                
            },type:BlockType.SERVICE
        };

        if (!this.spec.entities) {
            this.spec.entities = [];
        }
    }
    
    private blockTargetKinds() {
        return BlockTargetProvider.list(this.props.kind);
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
    private handleMetaDataChanged(inputName: string, userInput: string) {
        this.metadata[inputName] = userInput;

        this.invokeDataChanged();
    }

    @action
    private createDropdownOptions() {
        let options : { [key: string]: string } = {};
        this.blockTargetKinds().forEach((targetConfig) => options[targetConfig.kind.toLowerCase()]= targetConfig.name );
        return options;
    }

    @action
    private handleTargetKindChanged = (name:string,value:string) => {
        if (this.spec.target.kind === value) {
            return;
        }
        this.blockTargetKind=value        

        this.spec.target.kind = value;
        this.spec.target.options = {};

        this.invokeDataChanged();
    }


    @action
    private handleEntityFormClosed = () => {
        this.currentEntity = undefined;
        this.originalEntity = undefined;
    };

    @action
    private handleEditEntity = (entity:SchemaEntity) => {
        if (!this.sidePanel) {
            return;
        }

        this.currentEntity = new EntityFormModel(entity);
        this.originalEntity = entity;
        this.sidePanel.open();
    }

    @action
    private handleCreateEntity = () => {
        if (!this.sidePanel) {
            return;
        }
        this.currentEntity = new EntityFormModel();
        this.originalEntity = this.currentEntity.getData();
        this.sidePanel.open();
    }

    @action
    private handleRemoveEntity = (entity:SchemaEntity) => {
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
        //this.spec.entities is set to an empty array in case it`s undefined, otherwise the function will exit in the next Return.
        if(!this.spec.entities){
            this.spec.entities = [];
        }
        
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

        const ix = this.spec.entities.indexOf(this.originalEntity);

        if (ix === -1) {
            //Creating entity
            this.spec.entities.push(this.currentEntity.getData());
        } else {
            this.spec.entities[ix] = this.currentEntity.getData();
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
                <span>Target configuration</span>
                <TargetConfigComponent
                    value={this.spec.target.options ? toJS(this.spec.target.options) : {}}
                    onOptionsChanged={(config:Object) => { this.handleTargetConfigurationChange(config) }} />
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
                    onChange={(inputName, userInput)=>this.handleMetaDataChanged(inputName,userInput)} >                    
                </SingleLineInput>

                <SingleLineInput
                    name={"version"}
                    value={this.metadata.version}
                    label={"Version"}
                    validation={['required']}
                    help={"The version is automatically calculated for you using semantic versioning."}
                    disabled={true}
                    onChange={(inputName, userInput)=>this.handleMetaDataChanged(inputName,userInput)} >                    
                </SingleLineInput>

                <DropdownInput
                    name={"targetKind"}
                    value={this.blockTargetKind}
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
        return (
            <EntityList entities={entities} handleCreateEntity={this.handleCreateEntity} handleEditEntity={this.handleEditEntity} handleRemoveEntity={this.handleRemoveEntity} />
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