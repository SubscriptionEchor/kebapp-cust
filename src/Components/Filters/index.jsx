import { memo, useContext, useEffect, useState } from "react";
import { Sheet } from "react-modal-sheet";
import Close from "../../assets/svg/closebottomsheet.svg"
import filters1 from "./filters.json"
import "./style.css"
import Slider from 'rc-slider';
import CheckSelected from "../../assets/svg/checkselected.svg"
import CheckUnselected from "../../assets/svg/checkunselected.svg"
import Fire from "../../assets/gif/fire.gif"
import Star from "../../assets/gif/star.gif"
import Hat from "../../assets/gif/hat.gif"
import { MAP_CAMPAIGN_TYPE, SORTING_FILTER_ENUMS } from "../../constants/enums";
import Toggle from 'react-toggle';
import "react-toggle/style.css";
import { useTranslation } from "react-i18next";
import { BootstrapContext } from "../../Context/Bootstrap";


const Sort = memo(({ data, onSelect, optionIndex = 0 }) => {
    const { t } = useTranslation()
    return (
        <div className="">
            {data.map((item, index) => {
                return (
                    <div onClick={() => onSelect(index, item?.value, item?.selected, optionIndex)} className={`d-flex  justify-content-between align-items-center ${index < data?.length - 1 ? 'pb-3' : ''}`} key={index}>
                        <p className={`l-fs semiBold-fw ${item?.selected ? 'text-black' : 'un-select'}`}>{t(`mapfilters.${item?.label}`)}</p>
                        <input
                            onChange={() => onSelect(index, item?.value, item?.selected, optionIndex)}
                            checked={item?.selected}
                            type="radio"
                        />
                    </div>
                )
            })}
        </div>
    )
})

const FilterCampaign = memo(({ data, onSelect, optionIndex = 0 }) => {
    const { t } = useTranslation()
    return (
        <div className="">
            {data.map((item, index) => {
                return (
                    <div onClick={() => onSelect(index, item?.value, item?.selected, optionIndex)} className={`d-flex  justify-content-between align-items-center ${index < data?.length - 1 ? 'pb-3' : ''}`} key={index}>
                        <p className={`l-fs semiBold-fw ${item?.selected ? 'text-black' : 'un-select'}`}>{t(`mapfilters.${item?.label}`)}</p>
                        <input
                            onChange={() => onSelect(index, item?.value, item?.selected, optionIndex)}
                            checked={item?.selected}
                            type="radio"
                        />
                    </div>
                )
            })}
        </div>
    )
})

const SliderComponent = memo(({ data, onSelect }) => {
    return <div>
        <p className="m-fs mb-3 normal-fw">{data?.description}</p>
        <Slider
            key={data?.range?.selectedMax}
            defaultValue={data?.range?.selectedMax}
            onChangeComplete={res => { onSelect(data, res) }}
            min={data?.range?.min}
            max={data?.range?.max}
        />
        <div className="d-flex align-items-center mt-3" style={{ color: '#59574E' }}>
            <input onWheel={() => { }} onChange={e => {
                let value = e?.target?.value
                if (isNaN(value) || (value > data?.range?.max) || (value < data?.range?.min)) {
                    return
                }
                onSelect(data, Number(e?.target.value))
            }} value={data?.range?.selectedMax} className="text-center m-fs nromal-fw border me-2 px-1 rounded" style={{ width: 50, color: "#59574E" }} /> <p>{t('common.kmkkk')}</p>
        </div>
    </div>
})

const Filter = memo(({ onDraggable, data, onSelect, setRenderOptions, renderOptions, selectedOption, clearFilter, isFilterApplied }) => {
    const [labelSelected, setLabelSelected] = useState(data.sideLabels[0])
    const { t } = useTranslation()
    useEffect(() => {
        let result = data?.options?.find(res => res?.key?.toLowerCase() === labelSelected?.toLowerCase())
        if (!result) {
            return
        }
        if (!clearFilter && !isFilterApplied) {
            if (result?.filterType == "range" && selectedOption?.[result.key]) {
                result.range.selectedMax = selectedOption?.[result.key]
            }
            else {
                let verifyOptions = result?.options?.map(item => {
                    if (item.value == selectedOption?.[result?.key]) {
                        return {
                            ...item,
                            selected: true
                        }
                    }
                    return item
                })
                result["options"] = verifyOptions
            }
        }
        setRenderOptions(result)
    }, [labelSelected, data, clearFilter, isFilterApplied])

    return (
        <div className="d-flex ">
            <div className="side-labels border-end py-3 pb-5">
                {data?.sideLabels?.map((item, index) => {
                    const itemSelected = item == labelSelected
                    return (
                        <div className={`pb-3 l-fs semiBold-fw ${itemSelected ? 'secondary-color ' : 'text-black'}`} onClick={() => setLabelSelected(item)} key={index}>
                            <p>{item}</p>
                        </div>
                    )
                })}
            </div>
            <div className="pb-5 px-3 py-3" style={{ width: '70%' }}>
                {renderOptions?.options && (renderOptions?.key == SORTING_FILTER_ENUMS['RATING'] || renderOptions?.key == SORTING_FILTER_ENUMS['SORT'])
                    ? <Sort onSelect={onSelect} optionIndex={renderOptions?.index - 1} data={renderOptions?.options} /> :
                    renderOptions?.key == SORTING_FILTER_ENUMS.CAMPAIGN ? <FilterCampaign onSelect={onSelect} optionIndex={renderOptions?.index - 1} data={renderOptions?.options} /> :
                        <SliderComponent onSelect={onDraggable} optionIndex={renderOptions?.index - 1 || 0} data={renderOptions} />
                }
            </div>
        </div>
    )
})

const Cuisines = memo(({ onDraggable, data, onSelect, setRenderOptions, renderOptions, selectedOption, clearFilter, isFilterApplied }) => {
    let [cuisinesData, setCuisinesData] = useState([])
    const { t } = useTranslation()

    useEffect(() => {
        if (!clearFilter && !isFilterApplied && selectedOption?.length) {
            setCuisinesData(() => {
                return {
                    ...data, options: data?.options.map(item => {
                        return ({ ...item, selected: item?.selected || (selectedOption || [])?.includes(item.value) })
                    })
                }
            })
        }
        else {
            setCuisinesData(() => {
                return { ...data }
            })
        }
    }, [clearFilter, isFilterApplied, data])

    return (
        <div className="hide-scroll-bar">
            {cuisinesData?.options?.map((item, index) => {
                return (
                    <div onClick={() => onSelect(index, item?.value, item?.selected, index, cuisinesData?.options)} className="d-flex justify-content-between my-3" key={index}>
                        <p>{t(`mapfilters.${item?.label}`)}</p>
                        <img height={20} src={item.selected ? CheckSelected : CheckUnselected} />
                    </div>
                )
            })}
        </div>
    )
})

const MapFilter = memo(({ data, onSelect, clearFilter, onDraggable, setRenderOptions, renderOptions, selectedOption, isFilterApplied, bootstrapData }) => {
    const { t } = useTranslation()
    useEffect(() => {
        let res = data.map(result => {
            if (!clearFilter && !isFilterApplied) {
                if (result?.filterType == "range" && selectedOption?.[result.key]) {
                    result.range.selectedMax = selectedOption?.[result.key]
                }
                else {
                    let verifyOptions = result?.options?.map(item => {
                        if (item.value == selectedOption?.[result?.key]) {
                            return {
                                ...item,
                                selected: true
                            }
                        }
                        return item
                    })
                    result["options"] = verifyOptions
                }
            }
            return result
        })
        setRenderOptions(res)
    }, [data, clearFilter, isFilterApplied])

    const getOfferIcon = (value) => {
        switch (value) {
            case MAP_CAMPAIGN_TYPE.HAPPYHOURS:
                return <img className="ms-3 mb-1" height={40} width={40} src={Fire} />;
            case MAP_CAMPAIGN_TYPE.SPECIALDAY:
                return <img className="ms-2 mb-1" height={40} width={40} src={Star} />;
            case MAP_CAMPAIGN_TYPE.CHEFSPECIAL:
                return <img className="ms-3 mb-1" height={40} width={40} src={Hat} />;
            default:
                return null;
        }
    };

    const handleOfferSelect = (value, selected, index) => {
        onSelect(index, value, selected, 0)
    };

    const handleDistanceChange = (value, option) => {
        const numValue = Number(value);
        if (numValue >= 0 && numValue <= option?.range?.max) {
            onDraggable(option, numValue);
        }
    };

    const handleOptionToggle = (value, selected, index) => {
        onSelect(index, value, selected, 2);
    };

    return (
        <div key={renderOptions} className="">
            {(renderOptions && renderOptions?.length > 0) ? renderOptions?.map((option) => {
                return (
                    <div key={option} className="section-border pb-4">
                        <p className="mt-3 mb-2 xl-fs semiBold-fw black-text">{t(`mapfilters.${option?.label}`)}</p>
                        {option?.key == "offers" ? (
                            <div className="d-flex align-items-center justify-content-between">
                                {option?.options?.map((offer, index) => (
                                    <div
                                        key={offer.value}
                                        onClick={() => handleOfferSelect(offer.value, offer.selected, index)}
                                        className={`exciting-offer ${offer?.selected ? 'highlight-border' : ''}`}
                                    >
                                        <div>
                                            {getOfferIcon(offer.value)}
                                            <p className="s-fs normal-fw black-text">
                                                {bootstrapData?.promotions?.find(promotion => promotion.baseCode === offer.value)?.displayName}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : option?.key == "distance" ? (
                            <div className="d-flex align-items-center justify-content-between">
                                <div style={{ width: "65%", marginLeft: "4%" }}>
                                    <Slider
                                        key={option?.range?.selectedMax}
                                        defaultValue={option?.range?.selectedMax}
                                        min={option?.range?.min}
                                        max={option?.range?.max}
                                        onChangeComplete={res => handleDistanceChange(res, option)}
                                    />
                                </div>
                                <div className="d-flex align-items-center">
                                    <input
                                        disabled
                                        type="number"
                                        value={option?.range?.selectedMax}
                                        className="w-16 p-2 border rounded text-center"
                                        min={option?.range?.min}
                                        max={option?.range?.max}
                                    />
                                    <p className="m-fs normal-fw black-text ms-2">km</p>
                                </div>
                            </div>) : (
                            <div className="mt-4">
                                {option?.options?.map((opt, index) => (
                                    <div key={opt.value} className="d-flex align-items-center justify-content-between mb-3">
                                        <p className="m-fs normal-fw black-text">{opt.label}</p>
                                        <div className="me-1">
                                            <Toggle
                                                icons={false}
                                                checked={opt?.selected}
                                                onChange={() => handleOptionToggle(opt.value, opt.selected, index)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )

                        }
                    </div>
                )

            }) : null}
        </div>
    );
});


const render = (
    data,
    onSelect,
    setRenderOptions,
    renderOptions,
    selectedOption,
    clearFilter,
    onDraggable,
    isFilterApplied,
    bootstrapData
) => {
    switch (data?.key) {
        case SORTING_FILTER_ENUMS['SORT']:
            if (!isFilterApplied && !clearFilter) {
                let options = data?.options.map(res => {
                    if (selectedOption == res?.value) {
                        return {
                            ...res,
                            selected: true
                        }
                    }
                    return res
                })
                data.options = options
            }
            return (
                < div className="py-3" >
                    <Sort data={data?.options} onSelect={onSelect} />
                </div >)
        case SORTING_FILTER_ENUMS['FILTER']:
            return <Filter data={data} onSelect={onSelect} clearFilter={clearFilter} selectedOption={selectedOption} setRenderOptions={setRenderOptions} renderOptions={renderOptions} onDraggable={onDraggable} isFilterApplied={isFilterApplied} />
        case SORTING_FILTER_ENUMS['CUISINES']:
            return <Cuisines data={data} onSelect={onSelect} clearFilter={clearFilter} selectedOption={selectedOption} setRenderOptions={setRenderOptions} renderOptions={renderOptions} onDraggable={onDraggable} isFilterApplied={isFilterApplied} />
        case SORTING_FILTER_ENUMS['MAP_FILTER']:
            return <MapFilter data={data?.options} onSelect={onSelect} clearFilter={clearFilter} selectedOption={selectedOption} setRenderOptions={setRenderOptions} renderOptions={renderOptions} onDraggable={onDraggable} isFilterApplied={isFilterApplied} bootstrapData={bootstrapData} />
    }

}

const RenderUI = ({
    data,
    clearFilter,
    onSelect,
    onClickClearFilter,
    isFilterApplied,
    onClickApplyFilter,
    setRenderOptions,
    renderOptions,
    selectedOption,
    onDraggable,
    bootstrapData
}) => {
    const { t } = useTranslation();

    return (
        <div className="pd-horizontal py-3">
            <p className="pb-2 xxl-fs semiBold-fw border-bottom">{t(`mapfilters.${data?.label}`)}</p>
            <div className="border-bottom overflow-auto hide-scroll-bar" style={{
                maxHeight: "55vh",
                height: "auto",
                overflowY: "auto",
            }}>
                {render(data, onSelect, setRenderOptions, renderOptions, selectedOption, clearFilter, onDraggable, isFilterApplied, bootstrapData)}
            </div>
            <div className="d-flex justify-content-between pt-2  pb-3">
                <button onClick={onClickClearFilter} className="l-fs semiBold-fw border-0 text-center bg-white clear-all-btn">
                    {t('mapfilters.clearall')} </button>
                <button disabled={!isFilterApplied && !clearFilter} onClick={onClickApplyFilter} className={`l-fs semiBold-fw border-0 apply-btn ${(!isFilterApplied && !clearFilter) ? 'disable-btn' : 'secondary-bgcolor text-black'}`}>{t('mapfilters.apply')}</button>
            </div>
        </div>
    )

}

export default function SortFilter({ setIsOpen, isOpen, filterKey, setSelectedOption, selectedOption, setSelectedFilters, onHandleApplyFilter, cuisinesData }) {
    const [data, setData] = useState({})
    const [isFilterApplied, setIsFilterApplied] = useState(false)
    const [renderOptions, setRenderOptions] = useState({})
    const [clearFilter, setClearFilter] = useState(false)
    const [filters, setFilters] = useState([])
    const { bootstrapData } = useContext(BootstrapContext);

    useEffect(() => {
        if (!isOpen) return;
        const scrollY = window.scrollY;
        const originalOverflow = document.body.style.overflow;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = originalOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    useEffect(() => {
        setFilters(JSON.parse(JSON.stringify([...filters1])))
    }, [filters1])

    useEffect(() => {
        let result = filters.find(res => res?.key == filterKey)
        if (!result) {
            return
        }
        if (result?.key == "cuisines") {
            result.options = cuisinesData?.map(item => ({ label: item?.name, value: item?.name, selected: false }))
        }
        setData(result)
    }, [filterKey, isOpen, filters])

    const onSelect = (index, value, isSelected, optionIndex, cuisinesData) => {
        if (isSelected && filterKey != SORTING_FILTER_ENUMS['CUISINES'] &&
            filterKey != SORTING_FILTER_ENUMS['MAP_FILTER']) {
            return;
        }
        let res = { ...data }
        let options = res.options

        if (filterKey == SORTING_FILTER_ENUMS['FILTER'] || filterKey == SORTING_FILTER_ENUMS.MAP_FILTER) {
            options[optionIndex].options = options[optionIndex].options.map((item, idx) => ({
                ...item,
                selected: idx === index ? !isSelected : false
            }));
            const hasFilterChanged = options.some(option => {
                if (option.filterType === "range") return false;
                const selectedFilterValue = option.options.find(item => item.selected)?.value;
                const previousFilterValue = selectedOption?.[option.key];

                return selectedFilterValue && previousFilterValue !== selectedFilterValue;
            });



            setIsFilterApplied(hasFilterChanged);
        }
        else if (filterKey == SORTING_FILTER_ENUMS['CUISINES']) {
            res["options"] = cuisinesData
            res["options"][index].selected = !isSelected
            const newSelected = res.options.filter(item => item.selected).map(item => item.value);
            const prevSelected = selectedOption || [];
            const hasChanged =
                newSelected.length !== prevSelected.length ||
                newSelected.some(cuisine => !prevSelected.includes(cuisine));

            setIsFilterApplied(hasChanged);
        }
        else {
            options = options.map(item => ({ ...item, selected: false }))
            res["options"] = options
            res["options"][index].selected = !isSelected
            let result = res.options.find(item => item.selected)?.value
            let hasChanged = false
            if (result && result !== selectedOption) {
                hasChanged = true
            }
            setIsFilterApplied(hasChanged);

        }
        setData(res)

    }
    const onDraggable = (result, value, index = 1) => {
        let res = { ...data }
        result.range.selectedMax = value
        res.options[index] = result
        setData(res)
        let hasChanged = false
        if (result?.range?.selectedMax !== selectedOption?.distance) {
            hasChanged = true
        }
        setIsFilterApplied(hasChanged)
    }
    const onClickClearFilter = () => {
        if (!isFilterApplied && (!selectedOption || Object.keys(selectedOption)?.length == 0)) {
            return
        }
        // setFilters(JSON.parse(JSON.stringify([...filters1])))
        // setClearFilter(true)
        setSelectedOption({})
        setFilters(JSON.parse(JSON.stringify([...filters1])))
        setSelectedFilters((prev) => {
            let res = { ...prev }
            delete res[filterKey]
            if (filterKey == "filter") {
                delete res[SORTING_FILTER_ENUMS['SORT']]
            }
            if (filterKey == SORTING_FILTER_ENUMS['SORT']) {
                delete res.filter[SORTING_FILTER_ENUMS['SORT']]
            }
            onHandleApplyFilter(res)
            return res
        })
        setIsOpen(false)
    }
    const onClickApplyFilter = () => {
        // if (clearFilter) {
        //     setSelectedOption({})
        //     setFilters(JSON.parse(JSON.stringify([...filters1])))
        //     setSelectedFilters((prev) => {
        //         let res = { ...prev }
        //         delete res[filterKey]
        //         if (filterKey == "filter") {
        //             delete res[SORTING_FILTER_ENUMS['SORT']]
        //         }
        //         if (filterKey == SORTING_FILTER_ENUMS['SORT']) {
        //             delete res.filter[SORTING_FILTER_ENUMS['SORT']]
        //         }
        //         onHandleApplyFilter(res)
        //         return res
        //     })
        // }
        // else if
        if (filterKey == SORTING_FILTER_ENUMS['FILTER'] || filterKey == SORTING_FILTER_ENUMS['MAP_FILTER']) {
            let applyData = {}
            applyData = { ...selectedOption }
            data.options.forEach(({ key, filterType, options, range }) => {
                if (filterType == "range") {
                    if ((selectedOption?.distance == undefined && range?.selectedMax > 0) ||
                        (selectedOption?.distance && (selectedOption?.distance != range?.selectedMax))) {
                        applyData[key] = range?.selectedMax
                    }
                }
                else {
                    options?.forEach(option => {
                        if (option?.selected) {
                            applyData[key] = option.value
                        }
                    })
                }

            })
            setSelectedFilters((prev) => {
                prev = {
                    ...prev,
                    [data?.key]: applyData
                }
                let key = SORTING_FILTER_ENUMS['SORT']
                if (applyData?.[key]) {
                    prev[key] = applyData?.[key]
                }
                onHandleApplyFilter(prev)
                return prev
            })
        }
        else if (filterKey == SORTING_FILTER_ENUMS['CUISINES']) {
            let applyData = []
            data?.options.forEach(item => {
                if (item?.selected) {
                    applyData.push(item.value)
                }
            })
            setSelectedFilters((prev) => {
                prev = {
                    ...prev,
                    [data?.key]: applyData
                }
                onHandleApplyFilter(prev)
                return prev
            })
        }
        else {
            let res = data?.options.find(item => item?.selected)
            if (res) {
                setSelectedFilters((prev) => {
                    prev = {
                        ...prev,
                        [data?.key]: res?.value
                    }
                    if (res?.value) {
                        if (!prev?.filter) {
                            prev.filter = {}
                        }
                        prev.filter[SORTING_FILTER_ENUMS['SORT']] = res?.value
                    }
                    onHandleApplyFilter(prev)
                    return prev
                })
            }
        }
        setIsOpen(false)
        setClearFilter(false)
        setIsFilterApplied(false)
        setFilters(JSON.parse(JSON.stringify([...filters1])))
        setSelectedOption({})
    }

    return (
        <Sheet
            disableDrag={true}
            detent="content-height"
            isOpen={isOpen}
            style={{
                position: 'fixed',
                zIndex: 1000,
                height: '100%',
                bottom: 0,
                left: 0,
                right: 0,
            }}
        >
            <Sheet.Container>
                <Sheet.Header>
                    <div style={{ top: -50 }} className="d-flex  w-100 justify-content-center align-items-center position-absolute">
                        <img onClick={() => {
                            setIsOpen(false)
                            setIsFilterApplied(false)
                            setClearFilter(false)
                            setData([])
                            setFilters(JSON.parse(JSON.stringify([...filters1])))
                        }} src={Close} height={45} />
                    </div>
                </Sheet.Header>
                <Sheet.Content style={{
                    maxHeight: '75vh',
                }}>
                    <RenderUI
                        key={data}
                        data={data}
                        onDraggable={onDraggable}
                        renderOptions={renderOptions}
                        setRenderOptions={setRenderOptions}
                        onClickApplyFilter={onClickApplyFilter}
                        isFilterApplied={isFilterApplied}
                        onSelect={onSelect}
                        onClickClearFilter={onClickClearFilter}
                        selectedOption={selectedOption}
                        clearFilter={clearFilter}
                        bootstrapData={bootstrapData}
                    />
                </Sheet.Content>
            </Sheet.Container>
            <Sheet.Backdrop
                onTap={() => {
                    setIsOpen(false)
                    setIsFilterApplied(false)
                    setClearFilter(false)
                    setData([])
                    setFilters(JSON.parse(JSON.stringify([...filters1])))
                }}
                style={{
                    zindex: 100,
                    position: "absolute",
                }}
            />
        </Sheet>
    )
} 