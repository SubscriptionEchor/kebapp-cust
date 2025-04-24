import './style.css'
import React from 'react';
import Location from "../../assets/svg/location.svg"
import CitiesList from './citiesList';
import AreasList from './AreasList';
import { NotFound } from './NoZonepage';

const SearchResults = ({ loading, searchValue = '', cities, searchList }) => {

    // Filter cities that include the search value (case insensitive) and limit to 2
    const filteredCities = cities
        .filter(city =>
            city?.title.toLowerCase().includes(searchValue?.toLowerCase())
        )
        .slice(0, 2);

    // Filter search items: remove any item whose name appears in the filtered cities
    // const filteredSearchList = searchList.filter(item =>
    //     !filteredCities.some(city => city.title.toLowerCase() === item.name.toLowerCase())
    // );

    if (loading) {
        return <div className='text-center mt-3 d-flex justify-content-center'>
            <div className="search-loader" ></div>
        </div>
    }

    return (
        <div className=''>
            <CitiesList filteredCities={filteredCities} />
            <AreasList filteredSearchList={searchList} />
        </div>
    );
};

export default SearchResults;