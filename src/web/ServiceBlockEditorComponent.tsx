import React, {ComponentType, useMemo} from "react";

import type {ILanguageTargetProvider} from "@kapeta/ui-web-types";

import {
    FormAvatarEditorField,
    ConfigurationEditor,
    DataTypeEditor,
    DSL_LANGUAGE_ID,
    DSLConverters,
    DSLEntity,
    FormField,
    FormFieldType, FormRow,
    TabContainer,
    TabPage,
    useFormContextField
} from "@kapeta/ui-web-components";

import {BlockTargetProvider} from "@kapeta/ui-web-context";

import './ServiceBlockEditorComponent.less';
import {IconType, IconValue} from "@kapeta/schemas";

interface Props {
    creating?:boolean
}

export const ServiceBlockEditorComponent = (props:Props) => {

    const kindField = useFormContextField('kind');
    const targetKindField = useFormContextField('spec.target.kind');
    const entitiesField = useFormContextField('spec.entities');
    const configurationField = useFormContextField('spec.configuration');
    const iconField = useFormContextField('spec.icon');

    const targetKind = targetKindField.get();
    const kind = kindField.get();

    const targetDropdownOptions = useMemo(() => {
        const options: { [key: string]: string } = {};

        let defaultTarget:string|null = null;

        const addTarget = (targetConfig:ILanguageTargetProvider) => {
            const key = `${targetConfig.kind.toLowerCase()}:${targetConfig.version.toLowerCase()}`;
            if (!defaultTarget) {
                defaultTarget = key;
            }
            const title = targetConfig.title ?
                `${targetConfig.title} [${targetConfig.kind.toLowerCase()}:${targetConfig.version}]` :
                `${targetConfig.kind}:${targetConfig.version}`;
            options[key] = title;
        };

        BlockTargetProvider.listAll(kind).forEach(addTarget);
        if (targetKind && !options[targetKind]) {
            //Always add the current target if not already added.
            //This usually happens if block uses an older version
            try {
                const currentTarget = BlockTargetProvider.get(targetKind, kind);
                if (currentTarget) {
                    addTarget(currentTarget);
                }
            } catch (e) {
                console.warn('Failed to select target', e);
            }
        }
        return options;
    }, [kind, targetKind]);

    const TargetConfigComponent: ComponentType | null = useMemo(() => {
        if (targetKind) {
            try {
                const currentTarget = BlockTargetProvider.get(targetKind, kind);

                if (currentTarget && currentTarget.editorComponent) {
                    return currentTarget.editorComponent;
                }
            } catch (e) {
                console.warn('Failed to select target', e);
            }
        }
        return null;
    }, [targetKind]);

    const renderTargetConfig = () => {
        if (!TargetConfigComponent) {
            return <div></div>;
        }

        return (
            <div className="form-section">
                <h3>Target configuration</h3>
                <TargetConfigComponent />
            </div>
        );
    }



    const renderConfiguration = () => {

        const configuration = configurationField.get();
        const result = {
            code: configuration?.source?.value || '',
            entities: configuration?.types?.map ? configuration?.types?.map(DSLConverters.fromSchemaEntity) : []
        };

        return (
            <div className={'configuration-editor'}>
                <p className='info'>Define configuration data types for this block</p>
                <ConfigurationEditor value={result} onChange={(result) => {
                    result.entities && setConfiguration(result.code, result.entities);
                }} />
            </div>
        )
    }

    const setConfiguration = (code:string, results: DSLEntity[]) =>  {
        const types = results.map(DSLConverters.toSchemaEntity);
        const configuration = {
            types,
            source: {
                type: DSL_LANGUAGE_ID,
                value: code
            }
        };
        configurationField.set(configuration);
    }

    const renderEntities = () => {

        const entities = entitiesField.get();

        const result = {
            code: entities?.source?.value || '',
            entities: entities?.types?.map ? entities?.types?.map(DSLConverters.fromSchemaEntity) : []
        };

        return (
            <div className={'entity-editor'}>
                <p className='info'>Entities define external data types to be used by the resources for this block</p>
                <DataTypeEditor value={result} onChange={(result) => {
                    result.entities && setEntities(result.code, result.entities);
                }} />
            </div>
        )
    }

    const setEntities = (code:string, results: DSLEntity[]) =>  {
        const types = results.map(DSLConverters.toSchemaEntity);
        const entities = {
            types,
            source: {
                type: DSL_LANGUAGE_ID,
                value: code
            }
        };
        entitiesField.set(entities);
    }

    return (
        <div className={'service-block-config'}>
            <TabContainer defaultTab={'general'}>
                <TabPage id={'general'} title={'General'}>
                    <p className='info'>Service block that describes a backend exposing functionality such as APIs</p>
                    <FormAvatarEditorField
                        name={'spec.icon'}
                        label={'Icon'}
                        maxFileSize={1024 * 50}
                        help={'Select an icon for this block to make it easier to identify. Max 50 kb - and we recommend using a square SVG image.'}
                        fallbackIcon={'kap-icon-block'}
                    />
                    <FormField
                        name={"spec.target.kind"}
                        type={FormFieldType.ENUM}
                        label={"Target"}
                        validation={['required']}
                        help={"This tells the code generation process which target programming language to use."}
                        options={targetDropdownOptions}
                    />

                    {renderTargetConfig()}
                </TabPage>

                {!props.creating &&
                    <>
                        <TabPage id={'entities'} title={'Entities'}>
                            {renderEntities()}
                        </TabPage>
                        <TabPage id={'configuration'} title={'Configuration'}>
                            {renderConfiguration()}
                        </TabPage>
                    </>
                }

            </TabContainer>

        </div>
    )
};