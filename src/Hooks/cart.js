import { useState, useCallback, useContext } from 'react';
import UserContext from "../Context/User"

export const useCartLogic = (data, setCustomizedBottomSheet, setStep, restaurantData) => {
    const {
        checkItemCart,
        addQuantity,
        addCartItem,
        deleteItem,
        removeQuantity
    } = useContext(UserContext);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [selectedVariation, setSelectedVariation] = useState(null);
    const [updateItemsQuantity, setUpdateItemsQuantity] = useState([]);
    const [addonData, setAddonData] = useState(null);
    const [type, setType] = useState("dec");
    const [editid, setEditid] = useState(null);

    const addFoodToCart = async (food, categoryId, isCustomized, key) => {
        // // if (!data.isAvailable) {
        //     setCustomizedBottomSheet(false)
        //     return;
        // }
        await addToCart(food, categoryId, isCustomized, key);
    };

    const addToCart = async (food, categoryId, customized, key) => {
        if (
            food.variations.length == 1 &&
            food.variations[0].addons.length === 0
        ) {
            const result = checkItemCart(food._id);
            if (result.exist) await addQuantity(result.key);
            else
                await addCartItem(
                    food._id,
                    food.variations[0]._id || food.variations[0].title,
                    1,
                    [],
                    food.variations[0].price,
                    food.variations[0]?.discounted,
                    food.variations[0].title,
                    food?.title,
                    categoryId,
                    customized,
                    data?._id,
                    data?.name
                );
        } else {
            let res = {
                categoryId,
                food,
                addons: data?.addons,
                options: data?.options,
                restaurant: data?._id,
                image: data?.image,
                customized,
                restaurantId: data?._id,
                restaurantName: data?.name
            }
            setAddonData({ ...res });
            setCustomizedBottomSheet(true)

            const relatedItems = restaurantData?.filter(item => {
                // Check if the key is present
                if (key) {
                    // Filter by both _id and key
                    return item?._id === food?._id && item?.key === key;
                } else {
                    // Filter only by _id
                    return item?._id === food?._id;
                }
            }).map(item => ({ ...item, name: food?.title }));

            if (relatedItems?.length > 0) {
                setUpdateItemsQuantity(relatedItems)
                setType('inc')
            }
        }
    };

    const onSelectVariation = useCallback(
        (variation, id, qty) => {
            let result = {
                ...variation,
                addons: variation.addons.map((fa) => {
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
                }),
            }
            if (id) {
                result["key"] = id
                result['quantity'] = qty
            }
            setSelectedVariation(result);
        },
        [data]
    );

    const onSelectOption = async (addon, option) => {
        const index = selectedAddons?.findIndex((ad) => ad._id === addon._id);
        if (index > -1) {
            if (addon.quantityMinimum <= 1 && addon.quantityMaximum <= 1) {
                selectedAddons[index].options = [option];
            } else {
                const optionIndex = selectedAddons[index].options.findIndex(
                    (opt) => opt._id === option._id
                );
                if (selectedAddons[index].options.length >= addon.quantityMaximum && optionIndex === -1) {
                    return
                }
                if (optionIndex > -1) {
                    selectedAddons[index].options = selectedAddons[index].options.filter(
                        (opt) => opt._id !== option._id
                    );
                } else {
                    selectedAddons[index].options.push(option);
                }
                if (!selectedAddons[index].options.length) {
                    selectedAddons.splice(index, 1);
                }
            }
        } else {
            selectedAddons.push({ _id: addon._id, options: [option] });
        }
        setSelectedAddons([...selectedAddons]);
    };

    const onClickContinue = async (quantity = 1, clearFlag) => {
        const addons = selectedAddons?.map((addon) => ({
            ...addon,
            options: addon.options.map((option) => ({
                _id: option?._id,
                price: option?.price,
                title: option?.title,
                optionId: option.optionId,
            })),
        }));
        const cartItem = restaurantData?.find((cartItem) => {
            if (
                cartItem._id === addonData?.food._id &&
                cartItem.variation._id === selectedVariation?._id && cartItem?.restaurantId == data?._id
            ) {
                if (cartItem.addons.length === addons.length) {
                    if (addons.length === 0) return true;
                    const addonsResult = addons.every((newAddon) => {
                        const cartAddon = cartItem.addons.find(
                            (ad) => ad._id === newAddon._id
                        );

                        if (!cartAddon) return false;
                        const optionsResult = newAddon.options.every((newOption) => {
                            const cartOption = cartAddon.options.find(
                                (op) => op._id === newOption._id
                            );

                            if (!cartOption) return false;
                            return true;
                        });

                        return optionsResult;
                    });

                    return addonsResult;
                }
            }
            return false;
        });
        if (!cartItem) {
            await addCartItem(
                addonData?.food?._id,
                selectedVariation?._id,
                selectedVariation?.quantity || 1,
                addons,
                selectedVariation?.price,
                selectedVariation?.discounted,
                selectedVariation?.title,
                addonData?.food?.title,
                addonData?.categoryId,
                addonData?.customized,
                addonData?.restaurantId,
                addonData?.restaurantName,
                selectedVariation?.key
            );
        }
        else if (cartItem && !selectedVariation?.key) {
            await addQuantity(cartItem.key, 1);
        }
        else if (cartItem?.key == selectedVariation?.key) {
            await addQuantity(cartItem.key, 0);
        }
        else if (cartItem?.key != selectedVariation?.key) {
            await addQuantity(cartItem.key, selectedVariation.quantity);
            await deleteItem(selectedVariation?.key)
        }
        setStep(1)
        setSelectedVariation(null)
        setAddonData(null)
        setSelectedAddons([])
        setCustomizedBottomSheet(false)
        setUpdateItemsQuantity([])
    };

    const onClickIncrement = async (food, index) => {
        await addQuantity(food.key, 1)
        if (updateItemsQuantity?.length > 0) {
            let res = [...updateItemsQuantity]
            res[index]["quantity"] += 1
            setUpdateItemsQuantity(res)
        }
    }
    const onClickDecrement = async (food, index) => {
        if (food?.quantity == 1) {
            await deleteItem(food?.key)
            let res = [...updateItemsQuantity].filter(item => item?.key !== food?.key)
            setUpdateItemsQuantity(res)
            let checkRelatedItems = [...updateItemsQuantity].filter(item => item?._id == food?._id)
            if (checkRelatedItems?.length == 0) {
                setUpdateItemsQuantity([])
                setCustomizedBottomSheet(false)
            }
            return
        }
        await removeQuantity(food.key, 1)
        if (updateItemsQuantity?.length > 0) {
            let res = [...updateItemsQuantity]
            res[index]["quantity"] -= 1
            setUpdateItemsQuantity(res)
        }
    }

    const onClickShowPopupOrDecrement = (food, key) => {
        let res = restaurantData?.filter(item => {
            // Check if the key is present
            if (key) {
                // Filter by both _id and key
                return item?._id === food?._id && item?.key === key;
            } else {
                // Filter only by _id
                return item?._id === food?._id;
            }
        }).map(item => ({ ...item, name: food?.title }));
        if (!res || res?.length == 0) {
            return
        }
        if (res?.length > 1) {
            setUpdateItemsQuantity(res)
            setCustomizedBottomSheet(true)
            setType("dec")
            return
        }
        onClickDecrement(res[0], 0)
    }

    const resetCartState = () => {
        setSelectedAddons([]);
        setSelectedVariation(null);
        setAddonData(null);
        setUpdateItemsQuantity([]);
        setEditid(null);
    }

    return {
        addFoodToCart,
        onSelectVariation,
        onSelectOption,
        onClickContinue,
        onClickIncrement,
        onClickDecrement,
        onClickShowPopupOrDecrement,
        selectedAddons,
        setSelectedAddons,
        selectedVariation,
        setSelectedVariation,
        updateItemsQuantity,
        setUpdateItemsQuantity,
        addonData,
        setAddonData,
        type,
        setType,
        editid,
        setEditid,
        resetCartState
    };
};
export default useCartLogic