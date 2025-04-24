import React, { useContext, useEffect, useState } from 'react';
import './style.css';
import { useTranslation } from 'react-i18next';
import { Context } from '../../Context/Context';
import { gql, useMutation, useQuery } from '@apollo/client';
import Loader from '../../Components/Loader/Loader'
import { profile, updateUserName } from '../../apollo/server'
import Spinner from '../../Components/Spinner/Spinner';
import { showErrorToast, showSuccessToast } from '../../Components/Toast';

const PROFILE = gql`${profile}`;
const UPDATENAME = gql`${updateUserName}`;

const EditProfile = () => {
    const { t } = useTranslation();
    const { userDetails, setUserDetails } = useContext(Context);
    const [loader, setLoader] = useState(false);
    const [editName, setEditName] = useState('');

    const [updateNameMutation] = useMutation(UPDATENAME);

    useEffect(() => {
        if (userDetails) {
            setEditName(userDetails?.name)
        }
    }, [userDetails])

    // GET user details
    const { loading } = useQuery(PROFILE, {
        fetchPolicy: "network-only",
        // nextFetchPolicy: 'cache-only',
        onCompleted: (data) => {
            setUserDetails(data?.profile || {});

        },
        skip: userDetails
    });

    const handleOnChange = (e) => {
        let value = e.target.value;
        setEditName(value);
    };

    const onSave = async () => {
        setLoader(true);
        if (editName === userDetails?.name) {
            showErrorToast(t('toasts.Nochangesmade'));
            setLoader(false);
            return;
        }
        try {
            const { data } = await updateNameMutation({
                variables: {
                    name: editName,
                }
            });
            if (!data || !data?.updateUser?.name) {
                setLoader(false);
                return;
            }
            showSuccessToast(t('toasts.updated successfully'));
            setUserDetails(prevState => ({
                ...prevState,
                name: editName
            }));
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
        setLoader(false);
    };

    if (loading) {
        return <Loader />
    }

    return (
        <div className='profileComponent pd-horizontal py-4 ' style={{ paddingRight: "5%", paddingLeft: "5%" }}>
            <div className=''>
                <p className='xl-fs bold-fw black-text'>{t("profile.details")}</p>
                <p className='l-fs normal-fw black-text mt-4'>{t("profile.name")}</p>
                <input
                    className='profile-input-field text-black l-fs semiBold-fw'
                    type="text"
                    value={editName}
                    onChange={handleOnChange}
                />
                <p className='l-fs normal-fw black-text mt-4'>{t("profile.email")}</p>
                <input
                    disabled
                    className='profile-input-field-disabled text-black l-fs semiBold-fw'
                    type="text"
                    value={userDetails?.email}
                />
                <p className='l-fs normal-fw black-text mt-4'>{t("profile.mobile")}</p>
                <input
                    disabled
                    className='profile-input-field-disabled text-black l-fs semiBold-fw'
                    type="text"
                    value={userDetails?.phone}
                />
            </div>
            <div className='btn-cancel px-3 py-2 d-flex justify-content-center' style={{ width: "90%", position: "absolute", alignSelf: "center", bottom: 20 }} onClick={onSave}>
                {loader ? <Spinner color="black" size={24} /> : <p className='l-fs semiBold-fw black-text'>{t("profile.update")}</p>}
            </div>
        </div>
    );
};

export default EditProfile;