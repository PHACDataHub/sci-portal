import React, { useEffect, useState } from 'react';
import { Budget, useDataLoader } from '../../loaders/DataLoader';

interface BudgetLimitProps {
    projectId: string;
}

const BudgetLimit: React.FC<BudgetLimitProps> = ({ projectId }) => {
    const [budget, setBudget] = useState<Budget | null>(null);
    const { budgetLoader } = useDataLoader();

    useEffect(() => {
        let isMounted = true;

        // budgetLoader.load("river-sonar-415120").then((loadedBudget) => {
        //     if (isMounted) {
        //         setBudget(loadedBudget);
        //     }
        // });

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
                <strong>${budget?.totalCost.toFixed(2)}</strong>
            )}
        </div>
    );
};

export default BudgetLimit;