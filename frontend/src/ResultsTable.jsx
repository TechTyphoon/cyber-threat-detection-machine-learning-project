import React, { useState, useMemo } from 'react';

const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (typeof valA === 'string') {
          return sortConfig.direction === 'ascending' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        } else {
          if (valA < valB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (valA > valB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};

const ResultsTable = ({ data, columns, onRowClick, selectedRowIndex }) => {
  const allColumns = [...columns, 'prediction'];
  const { items, requestSort, sortConfig } = useSortableData(data, { key: 'prediction', direction: 'ascending' });

  const getSortDirectionSymbol = (name) => {
    if (!sortConfig || sortConfig.key !== name) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  return (
    <div className="table-container">
      <h3>Detailed Results (Click a row for explanation)</h3>
      <table>
        <thead>
          <tr>
            {allColumns.map((colName) => (
              <th key={colName} onClick={() => requestSort(colName)}>
                {colName.replace(/ /g, '\u00a0')}
                <span className="sort-symbol">{getSortDirectionSymbol(colName)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr 
              key={row.index} 
              className={`${row.is_attack ? 'attack-row' : ''} ${selectedRowIndex === row.index ? 'selected-row' : ''}`}
              onClick={() => onRowClick(row)}
            >
              {allColumns.map((colName) => (
                <td key={colName} title={row[colName]}>{row[colName]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResultsTable;