import React, { useEffect, useState, useRef } from 'react'
import { makeStyles } from '@mui/styles';

import { Link } from 'react-router-dom';
import properties from '../../../properties/properties';
import moment from 'moment';

import SquareAvatar from '../../../components/genericComponents/AvatarSquare';
import Tooltip from '@mui/material/Tooltip';
import NewChip from '../../../components/newChip/NewChip';
import AddVirtualMachineDialog from './AddVirtualMachineSet/AddVirtualMachineDialog';
import GenericPopoverDropdown from '../../../components/genericComponents/GenericPopoverDropdown';

import CommonListingPage from '../../../components/genericComponents/ListingPage/CommonListingPage';
import useAdvanceFilter from '../../../components/customHooks/useAdvanceFilter';
import useDialogState from '../../../components/customHooks/useDialogState';
const useStyles = makeStyles(() => ({
  root: {
    backgroundColor: "#fff",
    padding: "20px",
    minHeight: "calc(100vh - 70px)",
    "& .table-view": {
      border: "1px solid #E6E6E6",
      borderRadius: "6px",
      display: "grid",
      gridTemplateColumns: "211px 211px 171px 212px 1fr",
      fontWeight: 500,
      color: "#2F2F2F",
      fontSize: "12px",
      "& .table-view-row": {
        borderBottom: "1px solid #e6e6e6",
        padding: "9.5px 12px",
        display: "flex",
        alignItems: "center",
        fontWeight: 600,
        color: "#2f2f2f",
        "&:nth-last-child(-n+5)": { borderBottom: "none" },
      },
      "& .table-view-row-header": {
        padding: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        color: "#2F2F2F",
        borderBottom: "1px solid #e6e6e6",
        fontWeight: 600,
      },
    },
  },
}));
const DEFAULT_FILTERS = ["virtual_group_name", "environment_master_type"];

const MORE_FILTER_DATA = [
  { label: "Name", value: "virtual_group_name" },
  { label: "Restricted Envs", value: "environment_master_type" },
];

const RESET_FILTER_DATA = {
  virtual_group_name: [],
  environment_master_type: [],
};
function getEnvChipVariant(envName) {
  if (!envName) return "light";
  const env = envName.toLowerCase().trim();
  const map = {
    dev: "info", development: "info",
    prod: "highlight", production: "highlight",
    uat: "warning",
    qa: "success", quality: "success",
    staging: "error", stage: "error",
  };
  return map[env] ?? "light";
}

function filterDataParseForVMName(data) {
  return data?.map((item) => ({
    label: item.virtual_group_name,
    value: item.virtual_group_name,
    ...item,
  }));
}

function filterDataParseForVMEnvs(data) {
  const envMap = new Map();
  data?.forEach((item) => {
    item.env_obj?.forEach((env) => {
      if (!envMap.has(env.id)) {
        envMap.set(env.id, { label: env.name.toUpperCase(), value: env.id });
      }
    });
  });
  return Array.from(envMap.values());
}
const TableHeaders = () => (
  <>
    <div className="table-view-row-header">Virtual Machine Set</div>
    <div className="table-view-row-header">Mapped Envs</div>
    <div className="table-view-row-header">VMs Connected</div>
    <div className="table-view-row-header">Last Edited</div>
    <div className="table-view-row-header" />
  </>
);

const VmRow = ({ item, onEdit, onRefresh }) => (
  <>

    <div className="table-view-row gap-12px">
      <SquareAvatar varient="double" shape="sm-box" name={item.virtual_group_name} />
      &nbsp;&nbsp;
      <Tooltip title={item.virtual_group_name} arrow placement="top">
        <Link
          to={`/vm-group/${item.id}/vm/list`}
          className="text-anchor-blue"
          style={{
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "inline-block",
          }}
        >
          {item.virtual_group_name}
        </Link>
      </Tooltip>
    </div>


    <div className="table-view-row" style={{ gap: 6, flexWrap: "wrap" }}>
      {item.env_obj.slice(0, 2).map((env) => (
        <NewChip
          key={env.id}
          label={env.name.toUpperCase()}
          variant={getEnvChipVariant(env.name)}
          size="md"
          shape="standard"
        />
      ))}
      {item.env_obj.length > 2 && (
        <Tooltip
          title={
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 6, padding: 4, maxWidth: 300 }}>
              {item.env_obj.slice(2).map((env) => (
                <NewChip
                  key={env.id}
                  label={env.name.toUpperCase()}
                  variant={getEnvChipVariant(env.name)}
                  size="md"
                  shape="standard"
                />
              ))}
            </div>
          }
          arrow
          placement="top"
          componentsProps={{
            tooltip: {
              sx: {
                bgcolor: "#fff !important",
                boxShadow: "0px 4px 12px rgba(0,0,0,0.1) !important",
                borderRadius: "8px !important",
                padding: "4px !important",
              },
            },
            arrow: { sx: { color: "#fff !important" } },
          }}
        >
          <span style={{ cursor: "pointer" }}>
            <NewChip label={`+${item.env_obj.length - 2}`} shape="standard" size="md" />
          </span>
        </Tooltip>
      )}
    </div>


    <div className="table-view-row font-weight-500">
      {item.virtual_machines?.length > 0
        ? `${item.virtual_machines.filter((vm) => vm.status === "ONLINE").length} / ${item.virtual_machines.length}`
        : "N/A"}
    </div>


    <div className="table-view-row font-weight-500">
      {item.updated_at ? moment(item.updated_at).fromNow() : moment().fromNow()}
    </div>


    <div className="table-view-row" style={{ justifySelf: "end", width: "100%" }}>
      <div style={{ marginLeft: "auto" }}>
        <GenericPopoverDropdown
          data={{ id: item.id }}
          id={item.id}
          name={item.virtual_group_name}
          handleRefresh={onRefresh}
          menuConfig={[
            {
              type: "click",
              label: "Edit",
              icon: "ri-edit-line",
              onClick: () => onEdit(item),
            },
            {
              type: "delete",
              entityName: "virtual_group_name",
              entityLabel: "virtual group",
              api: properties.api.edit_vm_group,
              placeholders: { edit_id: item.id },
              varient: "new_ui_versioning",
              refresh: onRefresh,
            },
          ]}
        />
      </div>
    </div>
  </>
);

const VmGroupsListing = () => {
    const classes = useStyles();
    const refreshRef = useRef(null);

    const { filterState, onUpdateHandle, resetAdvFilter } = useAdvanceFilter({
        defaultFilters: DEFAULT_FILTERS,
        resetData:      RESET_FILTER_DATA,
        keyMap:         { name_adv_1: 'virtual_group_name', env_id_adv_2: 'environment_master_type' },
        syncUrl:        true,
    });

    const advanceFilterJson = {
    virtual_group_name: {
      staticList: false,
      labelName: "Name",
      uniqueId: "name_adv_1",
      searchVariable: "virtual_group_name",
      getFetchUrl: properties.api.create_vm_group,
      searchUrl: properties.api.create_vm_group,
      autoClosedAfterSelection: true,
      apiHitOnClick: true,
      filterDataPraseFunction: filterDataParseForVMName,
    },
    environment_master_type: {
      staticList: false,
      uniqueId: "env_id_adv_2",
      labelName: "Env",
      searchVariable: "environment_master_type",
      getFetchUrl: properties.api.create_vm_group,
      searchUrl: properties.api.create_vm_group,
      autoClosedAfterSelection: true,
      showMoreNotRequired: true,
      filterDataPraseFunction: filterDataParseForVMEnvs,
    },
  };

    const { dialogState, handleOpen, handleClose, handleSuccess } = useDialogState(refreshRef);

    return (
        <div className={classes.root}>
            <CommonListingPage
                heading="Virtual Machine Group"
                subHeading="Displaying all connected and disconnected virtual machines groups."
                icon="ri-cpu-line"
                primaryButton={{ actionType: 'open-dialog', text: 'Add VM Group', icon: <span className="ri-add-line" />, action: () => handleOpen(), buttonClass: 'btn-primary' }}
                endpoint={properties.api.create_vm_group}
                advanceFilter={{
                    filters:          filterState.moreAdvFilterList,
                    advanceFilterJson,
                    moreFilterData:   MORE_FILTER_DATA,
                    advFilters:       filterState.advFilters,
                    resetCount:       filterState.resetCount,
                    onUpdate:         onUpdateHandle,
                    onReset:          resetAdvFilter,
                }}
                skeleton={{ count: 10, height: '44px' }}
                emptyState={{ text: 'You have no VM group added', variant: 'inside-table' }}
            >
                {(data, refresh) => {
                    refreshRef.current = refresh;
                    return (
                        <div className="table-view mb-20 mt-20">
                            <TableHeaders />
                            {data.map(item => (
                                <VmRow key={item.id} item={item} onEdit={handleOpen} onRefresh={refresh} />
                            ))}
                        </div>
                    );
                }}
            </CommonListingPage>

            <AddVirtualMachineDialog
                open={dialogState.open}
                handleClose={handleClose}
                handleSuccess={handleSuccess}
                editData={dialogState.editData}
            />
        </div>
    );
};
VmGroupsListing.propTypes = {};

export default VmGroupsListing;
