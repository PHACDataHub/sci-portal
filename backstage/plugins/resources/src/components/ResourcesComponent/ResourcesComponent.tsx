import React from 'react';
import {
  StatusError,
  StatusOK,
  StatusPending,
  Table,
  TableColumn,
} from '@backstage/core-components';
export const ResourcesComponent = () => {
  const resources = [
    {
      costCentre: 'CAE0780549852',
      createdDate: '2023-11-15',

      resourceType: 'Storage Bucket',
      resourceName: 'storage-bucket-123',
      status: (
        <>
          <StatusOK>Ready</StatusOK>
        </>
      ),
    },
    {
      costCentre: 'TBX5495246752',
      createdDate: '2022-07-04',
      resourceType: 'Epidemiologist R Analytics Environment',
      resourceName: 'epidemiologist-env-123',
      status: (
        <>
          <StatusError>Action Required</StatusError>
        </>
      ),
    },
    {
      costCentre: 'ADF8132546795',
      createdDate: '2023-09-21',
      resourceType: 'Storage Bucket',
      resourceName: 'storage-bucket-456',
      status: (
        <>
          <StatusPending>Pending</StatusPending>
        </>
      ),
    },
    {
      costCentre: 'TBX5495246752',
      createdDate: '2024-01-03',
      resourceType: 'Storage Bucket',
      resourceName: 'storage-bucket-789',
      status: (
        <>
          <StatusPending>Pending</StatusPending>
        </>
      ),
    },
    {
      costCentre: 'CAE0780549852',
      createdDate: '2021-01-03',
      resourceType: 'Epidemiologist R Analytics Environment',
      resourceName: 'epidemiologist-env-456',
      status: (
        <>
          <StatusOK>Ready</StatusOK>
        </>
      ),
    },
    {
      costCentre: 'TBX5495246752',
      createdDate: '2024-01-03',
      resourceType: 'Epidemiologist R Analytics Environment',
      resourceName: 'epidemiologist-env-789',
      status: (
        <>
          <StatusOK>Ready</StatusOK>
        </>
      ),
    },
    {
      costCentre: 'TBX5495246752',
      createdDate: '01/03/2024',
      resourceType: 'Storage Bucket',
      resourceName: 'storage-bucket-789',
      status: <StatusPending>Pending</StatusPending>,
    },
    {
      costCentre: 'CAE0780549852',
      createdDate: '01/03/2024',
      resourceType: 'Epidemiologist R Analytics Environment',
      resourceName: 'epidemiologist-env-456',
      status: <StatusOK>Ready</StatusOK>,
    },
    {
      costCentre: 'TBX5495246752',
      createdDate: '01/03/2024',
      resourceType: 'Epidemiologist R Analytics Environment',
      resourceName: 'epidemiologist-env-789',
      status: <StatusOK>Ready</StatusOK>,
    },
  ];
  const columns: TableColumn[] = [
    { title: 'Status', field: 'status', sorting: false },
    {
      title: 'Resource Name',
      field: 'resourceName',
    },
    { title: 'Resource Type', field: 'resourceType' },
    { title: 'Cost Centre', field: 'costCentre' },
    { title: 'Created Date', field: 'createdDate' },
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
