import React, { useEffect, useState } from 'react';
import { Budget, useDataLoader } from '../../loaders/DataLoader';
interface BudgetUsageProps {
    projectId: string;
}

const BudgetUsage: React.FC<BudgetUsageProps> = ({ projectId }) => {
    const [budget, setBudget] = useState<Budget | null>(null);
    const { budgetLoader } = useDataLoader();

    useEffect(() => {
        let isMounted = true;

        budgetLoader.load(projectId).then((loadedBudget) => {
            if (isMounted) {
                setBudget(loadedBudget);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [projectId, budgetLoader]);

    return (
        <div>
            {budget && (
                <strong>{budget?.budgetConsumed.toFixed(2)}</strong>
            )}

        </div>
    );
};

export default BudgetUsage;