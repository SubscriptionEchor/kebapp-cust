import React, { useCallback, useContext, useEffect, useState } from 'react'
import './style.css'
import UserContext from '../../Context/User';
import { LOCALSTORAGE_NAME } from '../../constants/enums';
import { formatToGermanNumber } from '../../Utils';
import { useTranslation } from 'react-i18next'

function Variations({ data, onSelectVariation, onClickContinue, selectedVariation, setSelectedVariation, editid, setSelectedAddons }) {
    const { t } = useTranslation();
    const { cart } = useContext(UserContext)
    const [symbol, setSymbol] = useState('');
    useEffect(() => {
        let symbol = localStorage.getItem(LOCALSTORAGE_NAME.CURRENCY_SYMBOL);
        setSymbol(symbol);
    }, [])

    useEffect(() => {
        if (!data) return;

        const processAddons = (addonIds) => {
            return addonIds.map((fa) => {
                const addon = data?.addons.find((a) => a._id === fa);
                const addonOptions = addon.options.map((ao) => {
                    const matchedOption = data?.options.find((o) => o._id === ao._id);
                    if (matchedOption) {
                        return {
                            ...matchedOption,
                            optionId: ao.optionId
                        };
                    }
                    return matchedOption;
                });
                return {
                    ...addon,
                    options: addonOptions,
                };
            })
        };

        const defaultVariation = data.food.variations[0];

        if (!selectedVariation) {
            setSelectedVariation({
                ...defaultVariation,
                addons: processAddons(defaultVariation.addons),
            });
            setSelectedAddons([]);
        }

        if (editid && cart?.length > 0) {
            const selectedItem = cart.find(item => item?.key === editid?.key);
            if (selectedItem) {
                setSelectedVariation({
                    key: editid?.key,
                    quanrity: selectedItem?.quantity,
                    ...selectedItem.variation,
                    addons: processAddons(selectedItem.variation?.addons || defaultVariation.addons),
                });
                setSelectedAddons(selectedItem?.addons || []);
            }
        }

    }, [data, editid, cart]);

    return (
        <div className="mt-3">
            <p className="text-dark bold-fw xl-fs">{data?.food?.title}</p>
            <div className="py-2">
                {data?.food?.variations?.map((item, index) => {
                    return (
                        <div onClick={() => onSelectVariation(item, editid?.key, editid?.quantity)} className="variation d-flex justify-content-between align-items-center  p-3  mb-2 rounded-3" key={index}>
                            <h1 className="semiBold-fw m-fs p-0 m-0 text-nowrap text-ellipsis w-50" >{item?.title}</h1>
                            <div className='d-flex'>
                                {item?.discounted > 0 ? <h1 className="text-nowrap  m-fs p-0 m-0 discount-price">{symbol} {formatToGermanNumber(Number(item?.price) + Number(item?.discounted))}</h1> : null}
                                <h1 className="text-nowrap semiBold-fw m-fs p-0 m-0 mx-2">{symbol} {formatToGermanNumber(item?.price)}</h1>
                                <input
                                    onChange={() => onSelectVariation(item, editid?.key, editid?.quantity)}
                                    checked={item?.title == selectedVariation?.title}
                                    type="radio"
                                />
                            </div>
                        </div>
                    )
                })}
                <div className="my-3 d-flex justify-content-end">
                    <button onClick={onClickContinue}
                        className="rounded-3 l-fs  bottom-sheet-btns semiBold-fw px-4 py-2 secondary-bgcolor text-black border-0">{t("addons.continue")}</button>
                </div>
            </div>
        </div>
    )
}
export default React.memo(Variations)