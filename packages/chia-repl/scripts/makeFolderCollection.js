let collectionMetaData1 = metadataFactory.createCollecitonMetadata('my-folder-collection',
    ['Twitter', '@dkackman']
    ['webstite', 'https://github.com/dkackman/chia-repl']);

await mintCollectionFromFolder(2,
    'txch1ysc4yqr20m27lwfag2ukx6vdktdlrt40zulfntrfy350sxsdlcjqrw5rz9',
    collectionMetaData,
    'C:\\tmp\\nft',
    '.jpg',
    0,
    'txch1ysc4yqr20m27lwfag2ukx6vdktdlrt40zulfntrfy350sxsdlcjqrw5rz9',
    150);
