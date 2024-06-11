import React, { ReactNode, useEffect, useState } from 'react';
import { Budget, useDataLoader } from '../../loaders/DataLoader';

interface BudgetComponentProps {
  projectId: string;
  render: (budget: Budget | null) => ReactNode;
}

const BudgetComponent: React.FC<BudgetComponentProps> = ({
  projectId,
  render,
}) => {
  const [budget, setBudget] = useState<Budget | null>(null);
  const { budgetLoader } = useDataLoader();

  useEffect(() => {
    let isMounted = true;

    budgetLoader.load(projectId).then(loadedBudget => {
      if (isMounted) {
        setBudget(loadedBudget);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [projectId, budgetLoader]);

  return render(budget);
};

interface BudgetLimitProps {
  projectId: string;
}

export const BudgetLimit: React.FC<BudgetLimitProps> = ({ projectId }) => {
  return (
    <BudgetComponent
      projectId={projectId}
      render={(budget: Budget | null) => (
        <div>{budget && <strong>${budget.totalCost.toFixed(2)}</strong>}</div>
      )}
    />
  );
};

interface BudgetUsageProps {
  projectId: string;
}

export const BudgetUsage: React.FC<BudgetUsageProps> = ({ projectId }) => {
  return (
    <BudgetComponent
      projectId={projectId}
      render={(budget: Budget | null) => (
        <div>
          {budget && <strong>{budget.budgetConsumed.toFixed(2)}</strong>}
        </div>
      )}
    />
  );
};
