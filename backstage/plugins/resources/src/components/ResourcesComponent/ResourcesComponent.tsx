import React from 'react';
import {
  Link,
  StatusError,
  StatusOK,
  StatusPending,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { IconButton, Tooltip, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  iconButton: {
    width: '40px',
    height: '40px',
    marginLeft: '8px',
    marginTop: 'auto',
    marginBottom: 'auto',
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
});

export const ResourcesComponent = () => {
  const classes = useStyles();

  interface TableData {
    resourceType: number;
    resourceName: string;
    size: string;
    status: string;
  }

  const resources = [
    {
      resourceType: 'Storage Bucket',
      resourceName: 'storage-bucket-123',
      status: (
        <Tooltip arrow title="Ready">
          <IconButton classes={{ root: classes.iconButton }}>
            <StatusOK />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      resourceType: 'Epidemiologist R Analytics Environment',
      resourceName: 'epidemiologist-env-123',
      status: (
        <Tooltip arrow title="Action Required">
          <IconButton classes={{ root: classes.iconButton }}>
            <StatusError />
          </IconButton>
        </Tooltip>
      ),
    },
    {
      resourceType: 'Storage Bucket',
      resourceName: 'storage-bucket-456',
      status: (
        <Tooltip arrow title="Pending">
          <IconButton classes={{ root: classes.iconButton }}>
            <StatusPending />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const columns: TableColumn[] = [
    { title: 'Status', field: 'status' },
    {
      title: 'Resource Name',
      field: 'resourceName',
      render: (row: Partial<TableData>) => (
        <Link color="secondary" to="/resources">
          {row.resourceName}
        </Link>
      ),
    },
    { title: 'Resource Type', field: 'resourceType' },
  ];

  return (
    <Table
      title="Resources"
      options={{ search: false, paging: true }}
      columns={columns}
      data={resources}
    />
  );
};
