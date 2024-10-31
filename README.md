# CODAP-Capstone

**Sponsor:** Chris Bryan (cbryan16@asu.edu) <br>
**Project Description:**
This project focuses on developing a privacy plugin for the CODAP software platform to implement privacy-preserving algorithms (such as k-anonymity and differential privacy). The plugin will enable users to anonymize datasets and visualize the impact of these algorithms on data privacy.

**Group Members:**

- Esteban Lee (etlee4@asu.edu)
- Mathm Alkaabi (maalkaa4@asu.edu)
- Nianwen Dan (ndan1@asu.edu)
- Riccardo De Maria (rdemari1@asu.edu)
- Tejovrash Acharya (tachary4@asu.edu)

### 1. Codebase

You will find the following directories:

(To be Determined)

- `/src`: Main source code for the CODAP privacy plugin
- `/public`: Static assets (HTML, CSS, images)
- `/docs`: Project documentation, including user guides and developer notes
- `/test`: Unit and integration tests for the project

### 2. **Contributing**

We follow a strict workflow to ensure code quality and maintain project integrity. Below are the guidelines for contributing to this repository:

- **New Feature Branch:** 
  Always create your personal feature branch based on the `main` branch. Do not create your branch from someone else’s branch to avoid conflicts and dependency issues. Your branch should follow this naming convention: 
  `yourname/feature-description`, e.g., `dan/add-privacy-algorithm`. This helps keep branches organized and identifiable by the owner and purpose.
  
- **ONLY Work on Your Own Branch:** 
  You should **ONLY** work on your own feature branch. Do not attempt to edit other group members' branches directly, as this may lead to **data loss** or merge conflicts. All collaboration should occur through pull requests and reviews, ensuring proper discussion before merging changes into `main`.

- **Keep Linear History:** 
  It is not required but you should keep your personal branch history **linear**. To do this, use **rebase** instead of **merge** when pulling updates from `main` into your branch. This ensures a cleaner commit history and avoids unnecessary merge commits. For example:
  
  ```bash
  git checkout main
  git pull
  git checkout your-branch-name
  git rebase main
  ```
  
  If conflicts arise during rebasing, resolve them carefully, and then proceed:
  ```bash
  git rebase --continue
  ```
  
- **Commit Guidelines:** 
  Follow a consistent commit message format to improve project history readability:

  ```
  <type>(<scope>): <subject>
  ```

  **Example:**
  ```
  fix: fixed invalid user table indexes.
  ```

  **Commit types:**
  - **feat**: Adding a new feature
  - **fix**: Fixing a bug
  - **docs**: Changes only to documentation (README, CHANGELOG, etc.)
  - **test**: Adding or modifying tests (unit tests, integration tests)
  - **style**: Formatting changes (e.g., whitespace, indentation) without logic alterations
  - **perf**: Performance improvements (e.g., optimization, algorithm enhancement)
  - **refactor**: Code refactoring without adding features or fixing bugs
  - **chore**: Changes to the build process, dependencies, or development tools
  - **revert**: Reverting a previous commit
  - **merge**: Code merging

  **Scope (optional):** 
  The scope describes which part of the codebase is affected by the commit. If there is no specific rule, describe the impacted functionalities.

  **Subject:** 
  The subject should be a short, clear description of the commit's purpose, ideally no more than 50-80 characters.

- **Pull Requests:** 
  All code contributions must be made via pull requests (PRs) from your feature branch to the `main` branch. Each PR should be reviewed by at least **one other group members** before merging. Ensure all tests pass and documentation is updated, if necessary, before submitting the PR.

- **Squash and Merge:** 
  We only allow the **squash and merge** option for merging pull requests. This ensures that all commits from your feature branch are combined into a single commit when merged into `main`, keeping the history clean and easy to navigate. Your feature branch commit history will still be visible in the **PR** for reference.

- **Remove Your Feature Branch After Merging:** 
  Once your PR is approved and merged using the squash and merge method, you must **delete your feature branch**. This helps to keep the repository clean. Don't worry—your branch's commit history will be preserved in the merged PR, so the work remains accessible.
