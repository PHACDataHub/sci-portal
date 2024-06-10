import React, { createContext, useContext, ReactNode } from 'react';
import { useApi, identityApiRef, configApiRef } from '@backstage/core-plugin-api';
import DataLoader from 'dataloader';

// Define the Budget interface to structure budget data
export interface Budget {
    projectId: string;
    totalCost: number;
    budgetLimit: number;
    budgetConsumed: number;
    currencyCode: string;
    lastSync: string;
}

// Function to fetch project budgets from the API
const fetchProjectBudgets = async (apiEndpoint: string, token: string): Promise<Budget[]> => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
        const response = await fetch(`${apiEndpoint}/api/budget-usage/usages`, { headers });
        if (!response.ok) {
            throw new Error(`Error fetching budgets: ${response.statusText}`);
        }
        const budgets = await response.json();
        return budgets;
    } catch (error) {
        console.error("ERROR_FETCHING_BUDGETS: An error occurred while fetching budgets", error);
        return [];
    }
};

// Define the context type for DataLoader
type DataLoaderContextType = {
    budgetLoader: DataLoader<string, Budget, string>;
};

// Create a context with undefined as the default value
const DataLoaderContext = createContext<DataLoaderContextType | undefined>(undefined);

// Define the props type for the DataLoaderProvider component
type DataLoaderProviderProps = {
    children: ReactNode;
};

// DataLoaderProvider component to provide DataLoader context to its children
export const DataLoaderProvider: React.FC<DataLoaderProviderProps> = ({ children }) => {
    // Use Backstage hooks to get the identity and configuration APIs
    const identityApi = useApi(identityApiRef);
    const config = useApi(configApiRef);
    const backendUrl = config.getString('backend.baseUrl');

    // Function to get user credentials from identity API
    const credentials = async () => {
        return await identityApi.getCredentials();
    }

    // Initialize the budget DataLoader
    const budgetLoader = new DataLoader<string, Budget>(async ids => {
        const budgetMap: { [key: string]: Budget } = {};
        const userCredentials = await credentials();
        if (userCredentials.token) {

            try {
                const budgets = await fetchProjectBudgets(backendUrl, userCredentials.token);
                if (budgets.length > 0) {
                    // Map budgets to their respective project IDs
                    for (const budget of budgets) {
                        budgetMap[budget.projectId] = budget;
                    }
                }
            } catch (error) {
                console.error("ERROR_FETCHING_BUDGETS", error);
            }

        }

        // Return the budgets in the order of the requested IDs
        return ids.map(id => budgetMap[id]);
    });

    // Provide the DataLoader context to the component tree
    return (
        <DataLoaderContext.Provider value={{ budgetLoader }}>
            {children}
        </DataLoaderContext.Provider>
    );
};

// Custom hook to use the DataLoader context
export const useDataLoader = (): DataLoaderContextType => {
    const context = useContext(DataLoaderContext);
    if (context === undefined) {
        throw new Error('useDataLoader must be used within a DataLoaderProvider');
    }
    return context;
};
