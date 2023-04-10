import React, {useMemo, useState} from 'react';
import {
    IBlockTypeProvider,
    SchemaKind,
    ILanguageTargetProvider
} from '@kapeta/ui-web-types';
import {BlockTargetProvider} from '@kapeta/ui-web-context';
import {ServiceBlockEditorComponent} from '../src/web/ServiceBlockEditorComponent';

import '@kapeta/ui-web-components/styles/index.less';
import {BlockDefinition} from "@kapeta/schemas";
import {EntityType} from "@kapeta/schemas/dist/cjs";
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
        version: '1.2.3'
    },
    spec: {
        target: {
            kind: targetConfig.kind
        },
        entities: {
            source: {
                type: 'kapeta-dsl',
                value: ''
            },
            types: [
                {
                    type: EntityType.Dto,
                    name: 'MyEntity',
                    properties: {
                        'id': {
                            type: 'string'
                        },
                        'tags': {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        'children': {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    childId: {
                                        type: 'integer'
                                    }
                                }
                            }
                        }
                    }
                }
            ]
        }
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
                           setDefinition(data);
                           console.log('Data changed', data);
                       }}>
            <ServiceBlockEditorComponent creating={false} />
        </FormContainer>
    )
};
