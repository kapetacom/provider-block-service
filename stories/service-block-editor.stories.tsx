import React, {useState} from 'react';
import {BlockMetadata, BlockServiceSpec, BlockType, SchemaKind, TargetConfig} from '@blockware/ui-web-types';
import {BlockTargetProvider} from '@blockware/ui-web-context';
import ServiceBlockEditorComponent from '../src/web/ServiceBlockEditorComponent';

import '@blockware/ui-web-components/styles/index.less';

const BLOCK_KIND = 'blocks.blockware.com/v1/Service';

const targetConfig:TargetConfig = {
  kind: 'my-language-target',
  name: 'My Language Target',
  blockKinds: [
    BLOCK_KIND
  ]
};

const ServiceBlock:SchemaKind<BlockServiceSpec, BlockMetadata> = {
  kind: BLOCK_KIND,
  metadata: {
    name: 'My block',
    version: '1.2.3'
  },
  spec: {
    type: BlockType.SERVICE,
    target: {
      kind: targetConfig.kind
    }
  }
};

BlockTargetProvider.register(targetConfig);

export default {
  title: 'Service Block'
};

export const Editor = () => {

  const [definition, setDefinition] = useState(ServiceBlock);

  return (
      <ServiceBlockEditorComponent {...definition} onDataChanged={((metadata, spec) => {
        setDefinition({
          kind: ServiceBlock.kind,
          metadata,
          spec
        })
      })} />
  )
};
