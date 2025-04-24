import { createContext, useContext, useEffect, useState } from "react"
import { customerBootstrap } from "../apollo/server"
import { gql, useLazyQuery, useQuery } from "@apollo/client";
import KebabLogo from '../assets/svg/KebabLogo.svg';
import { Context } from "./Context";
import Spinner from "../Components/Spinner/Spinner";
import { useTranslation } from "react-i18next";
import Loader from "../Components/Loader/Loader";
const COMBINED_QUERY = gql`${customerBootstrap}`;
export const BootstrapContext = createContext()
export function BootstrapProvider({ children }) {
    const { t } = useTranslation()
    const [bootstrapData, setBootstrapData] = useState({})
    const [getBootstrap] = useLazyQuery(COMBINED_QUERY)
    const { userDetails } = useContext(Context)
    const [loader, setLoader] = useState(false)


    useEffect(() => {
        (async () => {
            let lc = localStorage.getItem("token")
            let verifyBootstrapData = Object.keys(bootstrapData)
            if (!userDetails && !lc && !verifyBootstrapData?.length) {
                return
            }
            setLoader(true)
            const { data } = await getBootstrap()
            setLoader(false)
            if (data && data?.customerBootstrap) {
                setBootstrapData(data?.customerBootstrap)
            }
        })()
    }, [userDetails?._id || userDetails?.userId])

    if (loader) {
        return <Loader />
    }

    return (
        <BootstrapContext.Provider value={{
            bootstrapData, setBootstrapData
        }}>
            {children}
        </BootstrapContext.Provider>
    )
}