import React, {useState} from 'react';
import {
    BlockMetadata,
    BlockServiceSpec,
    BlockType,
    SchemaEntityType,
    SchemaKind,
    TargetConfig
} from '@blockware/ui-web-types';
import {BlockTargetProvider} from '@blockware/ui-web-context';
import ServiceBlockEditorComponent from '../src/web/ServiceBlockEditorComponent';

import '@blockware/ui-web-components/styles/index.less';

const BLOCK_KIND = 'blocks.blockware.com/v1/Service';

const targetConfig: TargetConfig = {
    kind: 'my-language-target',
    name: 'My Language Target',
    blockKinds: [
        BLOCK_KIND
    ]
};

const ServiceBlock: SchemaKind<BlockServiceSpec, BlockMetadata> = {
    kind: BLOCK_KIND,
    metadata: {
        name: 'My block',
        version: '1.2.3'
    },
    spec: {
        type: BlockType.SERVICE,
        target: {
            kind: targetConfig.kind
        },
        entities: {
            source: {
                type: 'blockware-dsl',
                value: ''
            },
            types: [
                {
                    type: SchemaEntityType.DTO,
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

    const [definition, setDefinition] = useState({kind:BLOCK_KIND,metadata:{name:'', version:''},spec:{type:BlockType.SERVICE,target:{kind:''}}});

    return (
        <ServiceBlockEditorComponent {...definition}
                                     creating={true}
                                     onDataChanged={((metadata, spec) => {
                                         setDefinition({
                                             kind: ServiceBlock.kind,
                                             metadata,
                                             spec
                                         });
                                         console.log('Data changed', metadata, spec);
                                     })}/>
    )
};

export const EditEditor = () => {

    const [definition, setDefinition] = useState(ServiceBlock);

    return (
        <ServiceBlockEditorComponent {...definition}
                                     creating={false}
                                     onDataChanged={((metadata, spec) => {
            setDefinition({
                kind: ServiceBlock.kind,
                metadata,
                spec
            });
            console.log('Data changed', metadata, spec);

        })}/>
    )
};
