
import './style.css'
import React from 'react';
import Increment from "../../assets/svg/increment.svg"
import Decrement from "../../assets/svg/decrement.svg"
import { useTranslation } from 'react-i18next';

function AddButton({ onClick, quantity, onClickDecrement }) {
    const { t } = useTranslation();
    return (
        <>
            {quantity > 0 ? <div style={{ width: 80 }} className="add-btn d-flex justify-content-between rounded-3  py-1 bg-white  m-fs bold-fw">
                <img onClick={onClickDecrement} src={Decrement} alt="decrement" className='px-2' />
                <p>{quantity}</p>
                <img onClick={(e) => onClick(e)} src={Increment} alt="increment" className='px-2' />
            </div> :
                <button onClick={(e) => onClick(e)} className="add-btn rounded-3 px-4 py-1 bg-white tertiary-color m-fs bold-fw">{t('buttons.add')}</button>}
        </>
    )
}

export default React.memo(AddButton)
