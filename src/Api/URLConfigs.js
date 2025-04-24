const URLConfigs = {
    /*https://ka-fd-tst.bytenexuscloud.com/graphql -> Vijay
    https://ka-fd-tst-nikhil.bytenexuscloud.com/graphql -> nikhil
    https://ka-fd-tst-santosh.bytenexuscloud.com/graphql -> santosh*/

    baseUrl:  process.env.REACT_APP_BASE_URL||'',
    assetUrl: process.env.REACT_APP_ASSET_URL || '',
}

export default URLConfigs