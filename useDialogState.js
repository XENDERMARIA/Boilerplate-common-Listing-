import React, { useState } from "react";

const useDialogState = (refreshRef) => {
    const [dialogState, setDialogState] = useState({ open: false, editData: null });

    const handleOpen  = (item = null) => setDialogState({ open: true,  editData: item });
    const handleClose = ()            => setDialogState({ open: false, editData: null });
    const handleSuccess = () => {
        handleClose();
        refreshRef?.current?.();
    };

    return { dialogState, handleOpen, handleClose, handleSuccess };
};

export default useDialogState;
