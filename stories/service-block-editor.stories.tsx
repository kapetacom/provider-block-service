import React, {useMemo, useState} from 'react';
import {ILanguageTargetProvider} from '@kapeta/ui-web-types';
import {BlockTargetProvider} from '@kapeta/ui-web-context';
import {ServiceBlockEditorComponent} from '../src/web/ServiceBlockEditorComponent';

import '@kapeta/ui-web-components/styles/index.less';
import {EntityType, BlockDefinition, Entity, EntityProperty} from "@kapeta/schemas";
import {FormContainer} from "@kapeta/ui-web-components";

const BLOCK_KIND = 'kapeta/block-type-service';

const targetConfig: ILanguageTargetProvider = {
    kind: 'my-language-target',
    title: 'My Language Target',
    version: '1.2.3',
    blockKinds: [
        BLOCK_KIND
    ],
    definition: {
        kind: 'my-language-target',
        metadata: {
            name: 'kapeta/test',
        }
    }
};


const ServiceBlock: BlockDefinition = {
    kind: BLOCK_KIND,
    metadata: {
        name: 'My block',
    },
    spec: {
        target: {
            kind: targetConfig.kind,
        },
        configuration: {
            source: {
                type: 'kapeta-dsl',
                value: ''
            },
            types: [
                {
                    name: 'CoreConfig',
                    type: EntityType.Dto,
                    properties: {
                        apiKey: {
                            type: 'string',
                            secret: true
                        },
                        name: {
                            type: 'string',
                            required: true,
                            defaultValue: '"My Block"'
                        },
                        enabled: {
                            type: 'boolean',
                            defaultValue: 'true'
                        },
                    }
                }
            ]
        },
        entities: {
            source: {
                type: 'kapeta-dsl',
                value: ''
            },
            types: [
                {
                    name: 'MyEntity',
                    type: EntityType.Dto,
                    properties: {
                        id: {
                            type: 'string'
                        },
                        'tags': {
                            type: 'string[]'
                        },
                        'children': {
                            ref: 'MyEntity[]'
                        }
                    }
                }
            ]
        },
    }
};

BlockTargetProvider.register(targetConfig);

export default {
    title: 'Service Block'
};

export const CreateEditor = () => {

    const initial:BlockDefinition = useMemo(() => {
        return {kind:BLOCK_KIND,metadata:{name:'', version:''},spec:{target:{kind:''}}};
    }, [])

    const [definition, setDefinition] = useState<BlockDefinition>(initial);

    return (
        <FormContainer initialValue={initial}
                       onChange={(data) => {
                           setDefinition(data);
                           console.log('Data changed', data);
                       }}>

        <ServiceBlockEditorComponent creating={true} />
        </FormContainer>
    )
};

export const EditEditor = () => {

    const [definition, setDefinition] = useState(ServiceBlock);

    return (
        <FormContainer initialValue={ServiceBlock}
                       onChange={(data) => {
                           setDefinition(data as BlockDefinition);
                           console.log('Data changed', data);
                       }}>
            <ServiceBlockEditorComponent creating={false} />
        </FormContainer>
    )
};
