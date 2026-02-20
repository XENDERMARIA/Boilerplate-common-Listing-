import React, { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import PageHeader from "../../PageHeader";
import PaginationTwo from "../../PaginationTwo";
import BlankPage from "../../BlankPage";
import PageError from "../Errors/PageError";
import SearchBar from "../../SearchBar";
import AdvanceSearchFilterCombo from "../AdvanceSearchFilter/AdvanceSearchFilterCombo";
import GenericSkeleton from "../Skeletons/GenericSkeleton";
import GenerateURL, { GenerateSearchURL } from "../../../util/APIUrlProvider";
import InvokeApi from "../../../util/apiInvoker";
import properties from "../../../properties/properties";

const CommonListingPage = ({
    heading,
    subHeading,
    icon,
    imgIcon,
    backgroundColor,
    primaryButton,
    secondaryButton,
    tertiaryButton,

    searchBar,
    advanceFilter,

    endpoint,
    urlParams,
    pageSize,

    loading: loadingProp,
    error: errorProp,
    statusCode: statusCodeProp,
    data: dataProp,
    count: countProp,
    total_page: totalPageProp,
    curr_page: currPageProp,
    next: nextProp,
    previous: previousProp,
    on_next_click,
    on_previous_click,
    on_pageNumber_click,
    onRefresh,

    skeleton,
    
    emptyState,

    errorVariant,

    children,
}) => {
    const [state, setState] = useState({
        loading: false,
        error: null,
        statusCode: null,
        data: [],
        count: 0,
        total_page: 0,
        curr_page: 1,
        next: null,
        previous: null,
    });

    const lastSearchRef = useRef(null);
    const isSelfManaged = Boolean(endpoint);
    const limit = pageSize ?? 10;

    const invokeApi = useCallback((url, pageNumber) => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        InvokeApi(
            { endPoint: url, httpMethod: "GET", httpHeaders: { "Content-Type": "application/json" } },
            (res) => {
                setState({
                    loading: false,
                    error: null,
                    statusCode: null,
                    data: res.results ?? [],
                    count: res.count ?? 0,
                    next: res.next ? properties.api.baseURL + res.next : null,
                    previous: res.previous ? properties.api.baseURL + res.previous : null,
                    total_page: Math.ceil((res.count ?? 0) / limit),
                    curr_page: pageNumber,
                });
            },
            (error, statusCode) => {
                setState(prev => ({ ...prev, loading: false, error, statusCode }));
            }
        );
    }, [limit]);

    const buildBaseUrl = useCallback(() => {
        return GenerateURL(urlParams ?? {}, endpoint);
    }, [endpoint, urlParams]);

    const fetchData = useCallback((searchParams = null) => {
        lastSearchRef.current = searchParams;
        let url = buildBaseUrl();
        if (searchParams) url = GenerateSearchURL(searchParams, url);
        invokeApi(url, 1);
    }, [buildBaseUrl, invokeApi]);

    const fetchNext = useCallback(() => {
        if (!state.next) return;
        invokeApi(state.next, state.curr_page + 1);
    }, [state.next, state.curr_page, invokeApi]);

    const fetchPrev = useCallback(() => {
        if (!state.previous) return;
        invokeApi(state.previous, state.curr_page - 1);
    }, [state.previous, state.curr_page, invokeApi]);

    const fetchPage = useCallback((pageNumber) => {
        if (pageNumber < 1 || pageNumber > state.total_page) return;
        let url = buildBaseUrl();
        if (lastSearchRef.current && Object.keys(lastSearchRef.current).length > 0)
            url = GenerateSearchURL(lastSearchRef.current, url);

        const sep = url.includes("?") ? "&" : "?";
        if (pageNumber > 1) url += `${sep}limit=${limit}&offset=${(pageNumber - 1) * limit}`;
        invokeApi(url, pageNumber);
    }, [buildBaseUrl, invokeApi, limit, state.total_page]);

    useEffect(() => {
        if (isSelfManaged) fetchData();
    }, [endpoint]);

    const loading = isSelfManaged ? state.loading : loadingProp;
    const error = isSelfManaged ? state.error : errorProp;
    const statusCode = isSelfManaged ? state.statusCode : statusCodeProp;
    const data = isSelfManaged ? state.data : dataProp;
    const count = isSelfManaged ? state.count : countProp;
    const total_page = isSelfManaged ? state.total_page : totalPageProp;
    const curr_page = isSelfManaged ? state.curr_page : currPageProp;
    const next = isSelfManaged ? state.next : nextProp;
    const previous = isSelfManaged ? state.previous : previousProp;
    const handleNext = isSelfManaged ? fetchNext : on_next_click;
    const handlePrev = isSelfManaged ? fetchPrev : on_previous_click;
    const handlePage = isSelfManaged ? fetchPage : on_pageNumber_click;
    const handleRefresh = isSelfManaged ? fetchData : onRefresh;

    return (
        <>
            <PageHeader
                heading={heading}
                subHeading={subHeading}
                icon={icon}
                imgIcon={imgIcon}
                backgroundColor={backgroundColor}
                primaryButton={primaryButton}
                secondaryButton={secondaryButton}
                tertiaryButton={tertiaryButton}
                commonDivMargin={false}
            />

            {(searchBar || advanceFilter) && (loading || data?.length > 0 || advanceFilter?.isFiltersApplied) && (
                <div
                    className="d-flex align-center"
                    style={{ margin: "20px 0", gap: 12, flexWrap: "wrap" }}
                >
                    {searchBar && (
                        <div style={{ width: searchBar.width ?? "37%" }}>
                            <SearchBar
                                search_data={searchBar.searchData}
                                default_filter={searchBar.defaultFilter}
                                search_call_back={searchBar.onSearch ?? (isSelfManaged ? fetchData : undefined)}
                                clear_search_callback={searchBar.onClear ?? handleRefresh}
                                realTimeApiCall={searchBar.realTime ?? false}
                                backgrounColor={searchBar.backgroundColor}
                                border={searchBar.border}
                            />
                        </div>
                    )}

                    {advanceFilter && (
                        <AdvanceFilterBar
                            config={advanceFilter}
                            fetchData={isSelfManaged ? fetchData : null}
                        />
                    )}
                </div>
            )}

            {error ? (
                <PageError
                    error={error}
                    statusCode={statusCode}
                    variant={errorVariant}
                    handleRefresh={isSelfManaged ? fetchData : onRefresh}
                />
            ) : (
                <>
                    {loading && (
                        <GenericSkeleton
                            variant={skeleton?.variant ?? "rect"}
                            count={skeleton?.count ?? 4}
                            height={skeleton?.height ?? "60px"}
                            style={{ borderRadius: "6px" }}
                        />
                    )}

                    {!loading && data?.length > 0 && (
                        <>
                            {typeof children === "function"
                                ? children(data, handleRefresh, emptyState)
                                : children}

                            <div style={{ marginTop: "20px" }}>
                                <PaginationTwo
                                    current_page_count={curr_page}
                                    total_count={total_page}
                                    count={count}
                                    next={next}
                                    previous={previous}
                                    on_previous_click={handlePrev}
                                    on_next_click={handleNext}
                                    on_pageNumber_click={handlePage}
                                />
                            </div>
                        </>
                    )}

                    {!loading && data?.length === 0 && (
                        <BlankPage
                            text={emptyState?.text}
                            subHeading={emptyState?.subHeading}
                            pageIcon={emptyState?.icon}
                            primaryButton={emptyState?.primaryButton}
                            additionalComponent={emptyState?.additionalComponent}
                            backgroundColor={emptyState?.backgroundColor}
                            variant={emptyState?.variant ?? "default"}
                            additionalStyles={emptyState?.additionalStyles}
                            type={emptyState?.type}
                        />
                    )}
                </>
            )}
        </>
    );
};
const AdvanceFilterBar = ({ config, fetchData }) => {
    const {
        filters,
        advanceFilterJson,
        moreFilterData,
        advFilters,
        resetCount,
        onUpdate,
        onReset,
        showReset = true,
    } = config;

    const handleUpdate = (uniqueId, list) => {
        onUpdate?.(uniqueId, list, fetchData);
    };

    return (
        <Grid container alignItems="center" wrap="nowrap">
            {filters?.map((filterName) => {
                const filterConfig = advanceFilterJson?.[filterName];
                if (!filterConfig) return null;
                return (
                    <div key={filterName} className="ad-more-search" style={{ whiteSpace: "nowrap" }}>
                        <AdvanceSearchFilterCombo
                            reset={resetCount}
                            selectedCheckBoxes={advFilters?.[filterName] ?? []}
                            searchVariable={filterConfig.searchVariable}
                            staticList={filterConfig.staticList}
                            uniqueId={filterConfig.uniqueId}
                            labelName={filterConfig.labelName}
                            searchUrl={filterConfig.searchUrl}
                            getFetchUrl={filterConfig.getFetchUrl}
                            placeholder_name={filterConfig.placeholder_name}
                            placeholder_value={filterConfig.placeholder_value}
                            filterDataPraseFunction={filterConfig.filterDataPraseFunction}
                            showMoreNotRequired={filterConfig.showMoreNotRequired}
                            onlySingleValueSelectionAllowed={filterConfig.onlySingleValueSelectionAllowed}
                            apiHitOnClick={filterConfig.apiHitOnClick}
                            onUpdate={handleUpdate}
                            autoClosedAfterSelection={filterConfig.autoClosedAfterSelection}
                        />
                    </div>
                );
            })}

            {moreFilterData && (
                <div className="ad-more-search" style={{ whiteSpace: "nowrap" }}>
                    <AdvanceSearchFilterCombo
                        selectedCheckBoxes={filters}
                        reset={resetCount}
                        staticList={moreFilterData}
                        autoClosedAfterSelection={true}
                        apiHitOnClick={true}
                        onUpdate={handleUpdate}
                        variant="more-button"
                        uniqueId="more-button-adv-0"
                    />
                </div>
            )}

            {showReset && onReset && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onReset(fetchData)}
                    onKeyDown={(e) => e.key === "Enter" && onReset(fetchData)}
                    className="pl-15 ml-20 d-flex align-center justify-center cursor-pointer"
                    style={{ borderLeft: "1px solid #dedede", height: 40, flexShrink: 0 }}
                >
                    <span className="font-13 cursor-pointer" style={{ color: "#595353" }}>
                        Reset
                    </span>
                </div>
            )}
        </Grid>
    );
};
CommonListingPage.propTypes = {
    heading: PropTypes.string.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.any,
    data: PropTypes.array,
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    errorVariant: PropTypes.oneOf(["REFRESH", "CLOSE", null]),
    subHeading: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    imgIcon: PropTypes.string,
    backgroundColor: PropTypes.string,
    primaryButton: PropTypes.object,
    secondaryButton: PropTypes.object,
    tertiaryButton: PropTypes.object,
    searchBar: PropTypes.object,
    advanceFilter: PropTypes.object,
    endpoint: PropTypes.string,
    urlParams: PropTypes.object,
    pageSize: PropTypes.number,
    statusCode: PropTypes.any,
    count: PropTypes.number,
    total_page: PropTypes.number,
    curr_page: PropTypes.number,
    next: PropTypes.string,
    previous: PropTypes.string,
    on_next_click: PropTypes.func,
    on_previous_click: PropTypes.func,
    on_pageNumber_click: PropTypes.func,
    onRefresh: PropTypes.func,
    skeleton: PropTypes.object,
    emptyState: PropTypes.object,
};

CommonListingPage.defaultProps = {
    loading: false,
    error: null,
    data: [],
    skeleton: {},
    emptyState: {},
    errorVariant: null,
    children: null,
    endpoint: null,
    urlParams: {},
    pageSize: 10,
};

export default CommonListingPage;
