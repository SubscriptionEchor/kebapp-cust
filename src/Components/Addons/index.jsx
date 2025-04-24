import React, { useEffect, useState } from 'react';
import './style.css'
import Checkbox from 'react-custom-checkbox';
import WhiteRightIcon from "../../assets/svg/whiteRightIcon.svg"
import { useTranslation } from 'react-i18next';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import { formatToGermanNumber } from "../../Utils";

export default function Addons({ step, setSelectedVariation, selectedVariation, setSelectedAddons, selectedAddons, setStep, onSelectOption, onClickContinue }) {
    const { t } = useTranslation()
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    const validateOrderItem = () => {
        const validatedAddons = selectedVariation?.addons.map((addon) => {
            const selected = selectedAddons.find((ad) => ad._id === addon._id);

            if (!selected && addon.quantityMinimum === 0) {
                addon.error = false;
            } else if (
                selected &&
                selected.options.length >= addon.quantityMinimum &&
                selected.options.length <= addon.quantityMaximum
            ) {
                addon.error = false;
            } else addon.error = true;
            return addon;
        });
        setSelectedVariation({ ...selectedVariation, addons: validatedAddons });
        return validatedAddons.every((addon) => addon.error === false);
    };

    const onPressAddToCart = () => {
        if (validateOrderItem()) {
            onClickContinue()
        }
    }

    const onSelectClicked = async (addon, option) => {
        await onSelectOption(addon, option);
        validateOrderItem();
    }


    return (
        <div className="py-2 " >
            <div className='' style={{ paddingBottom: 100 }}>
                {selectedVariation?.addons?.map((addon, index) => {
                    return (
                        <div key={index}>
                            <div className='' >
                                <h1 className="bold-fw xl-fs m-0 p-0">{addon?.title}</h1>
                                < h1 className='s-fs semiBold-fw m-0 p-0 text-black mb-3 mt-1'>{t('addons.selectUpto')} {addon?.quantityMaximum} option(s) {addon?.error ? <span className='text-danger ms-2'> {`${t('cart.minimum')} ${addon.quantityMinimum} ${t('cart.required')}`}</span> : null}</h1>
                            </div>
                            {addon?.options?.map((option, ind) => {
                                const selected = selectedAddons?.find((ad) => ad._id === addon._id);
                                let optionSelected = false
                                const options = selected?.options?.find((op) => op._id === option._id)
                                if (options) {
                                    optionSelected = true
                                }
                                return (
                                    <div onClick={() => onSelectClicked(addon, option)} key={ind} className="mb-2 p-3 border rounded-3">
                                        <div className="d-flex justify-content-between">

                                            <p className="me-2 semiBold-fw m-fs text-ellipsis text-nowrap" style={{ width: '65%' }}>{option?.title}</p>
                                            <div className="d-flex semiBold-fw m-fs">
                                                <p className='me-2'>{symbol} {formatToGermanNumber(option?.price)}</p>
                                                <Checkbox
                                                    borderColor={optionSelected ? 'rgba(237, 204, 39, 1)' : "black"}
                                                    checked={optionSelected}
                                                    icon={
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flex: 1,
                                                                backgroundColor: optionSelected ? "#EDCC27" : 'white',
                                                                alignSelf: "stretch",
                                                            }}
                                                        >
                                                            {optionSelected && <img src={WhiteRightIcon} />}
                                                        </div>
                                                    }
                                                    borderWidth={1}
                                                    style={{ overflow: "hidden" }}
                                                    size={18}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
            <div className="mt-4 mb-3 d-flex justify-content-between position-fixed bg-white" style={{ bottom: 0, left: 15, right: 15 }}>
                <button onClick={() => {
                    setSelectedAddons([])
                    setStep(1)
                }} className="rounded-3 l-fs prev-btn semiBold-fw px-4 py-2 text-black">{t('addons.previous')}</button>
                <button onClick={onPressAddToCart} className="rounded-3 l-fs semiBold-fw px-4 py-2 secondary-bgcolor text-black bottom-sheet-btns border-0">{t('addons.continue')}</button>
            </div>
        </div>
    )

}