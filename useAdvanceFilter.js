import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useAdvanceFilter = ({ defaultFilters, resetData, keyMap, syncUrl = false }) => {
    const history = useNavigate();

    const [filterState, setFilterState] = useState({
        moreAdvFilterList: [...defaultFilters],
        advFilters: { ...resetData },
        resetCount: 0,
    });
    useEffect(() => {
        if (!syncUrl) return;
        const urlSearchParams = new URLSearchParams(location.search);
        if (urlSearchParams.size === 0) return;

        let moreAdvFilter = [...defaultFilters];
        const advFilters = {};

        urlSearchParams.forEach((value, key) => {
            if (!value) return;
            if (key === 'adv_search') {
                const extra = value.split(',');
                moreAdvFilter = [...new Set([...moreAdvFilter, ...extra])];
            } else {
                advFilters[key] = value.split(',');
            }
        });

        setFilterState(prev => ({
            ...prev,
            moreAdvFilterList: moreAdvFilter,
            advFilters: { ...resetData, ...advFilters },
        }));
    }, []);

    const addFiltersToUrl = (filterName, filterValue) => {
        if (!syncUrl) return;
        let urlSearchParams = new URLSearchParams(location.search);
        if (filterName === 'all_delete') {
            urlSearchParams = new URLSearchParams();
        } else if (!filterValue || filterValue.length === 0) {
            urlSearchParams.delete(filterName);
        } else {
            urlSearchParams.set(filterName, filterValue.join(','));
        }
        history({ pathname: location.pathname, search: urlSearchParams.toString() });
    };

    const onUpdateHandle = (uniqueId, updatedList, fetchData) => {
        if (uniqueId === 'more-button-adv-0') {
            addFiltersToUrl('adv_search', updatedList);
            if (!updatedList?.length) {
                resetAdvFilter(fetchData);
            } else {
                setFilterState(prev => ({ ...prev, moreAdvFilterList: updatedList }));
            }
            return;
        }

        const updatedKey = keyMap[uniqueId];
        if (!updatedKey) return;

        const normalizedValues = updatedList.map(item =>
            typeof item === 'object' ? item.value : item
        );

        addFiltersToUrl(updatedKey, normalizedValues);
        setFilterState(prev => {
            const newAdvFilters = { ...prev.advFilters, [updatedKey]: normalizedValues };
            fetchData?.(newAdvFilters);
            return { ...prev, advFilters: newAdvFilters };
        });
    };

    const resetAdvFilter = (fetchData) => {
        addFiltersToUrl('all_delete');
        setFilterState(prev => ({
            moreAdvFilterList: [...defaultFilters],
            advFilters: { ...resetData },
            resetCount: prev.resetCount + 1,
        }));
        fetchData?.({ ...resetData });
    };

    return { filterState, onUpdateHandle, resetAdvFilter };
};

export default useAdvanceFilter;
