# FINWISE Integration Contract

## Financial Profile

The financial planning workflow will use the following information:

- income
- fixed expenses
- variable expenses
- savings
- debt
- EMI

## Goals

Each financial goal may contain:

- name
- target amount
- current amount
- target date
- priority

## Calculated Values

The financial engine may calculate:

- total expenses
- monthly surplus or deficit
- savings rate
- debt-to-income ratio
- goal progress
- remaining goal amount
- required monthly saving

## AI Responsibilities

The AI layer should:

- interpret calculated financial information
- identify useful observations
- explain financial concepts
- generate actionable planning suggestions
- explain what-if scenarios

The AI should not be relied upon for basic arithmetic when deterministic
calculations can be performed by the application.