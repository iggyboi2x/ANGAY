# $\color{#FFB300}{\text{ANGAY — Accessible Nutrition \ Goods Assistance for You}}$
> A demographic-informed food assistance coordination system that connects foodbanks and barangay communities for equitable, transparent, and needs-responsive aid distribution.

---
### $\Large {\text{Project Overview}}$

### **The Problem**

Food assistance in many barangays suffers from inequitable distribution — aid often fails to reach those who need it most due to a lack of coordinated data between foodbanks and local government units. There is no centralized system to track community demographics, monitor inventory, or log distribution history, resulting in wastage, duplication, and unmet needs.

### **Our Solution**

**ANGAY** bridges the gap between **foodbanks** and **barangay communities** by providing a structured digital platform for demographic profiling, inventory management, distribution coordination, and transparent reporting.

### **UN Sustainable Development Goals Addressed**

| SDG | Goal | How ANGAY Helps |
|-----|------|-----------------|
| **SDG 2** | Zero Hunger | Enables targeted food distribution based on demographic need, reducing hunger in underserved communities |
| **SDG 11** | Sustainable Cities & Communities | Promotes inclusive, transparent, and data-driven governance of local aid systems |

### **Key Features**

- **Barangay Demographic Profiling** — Aggregate socio-economic data per barangay (population, seniors, PWDs, children, poverty level)
- **Foodbank Inventory Management** — Track available goods by type, quantity, and target beneficiary
- **Interactive Barangay Map** — Visual demographic stats with sorting and filtering by need level
- **Distribution Proposal & Approval Workflow** — Structured coordination between foodbanks and barangays
- **Distribution Logging & History** — Transparent records of all distributions for accountability
- **Reporting Dashboard** — Summary statistics and historical allocation data

---
### $\Large{\text{Tech Stack}}$

| Layer | Technology |
|-------|------------|
| **Frontend** | [React](https://react.dev/) + [Vite](https://vitejs.dev/) |
| **Styling** | CSS / Tailwind CSS |
| **Backend & Database** | [Supabase](https://supabase.com/) (PostgreSQL + Auth + Storage) |
| **Version Control** | Git + GitHub |
| **Package Manager** | npm |

---

### $\Large{\text{Installation}}$

To set up a local development environment:

1.  **Clone the Repository:**
    ```bash
    git clone [https://github.com/your-username/angay.git](https://github.com/your-username/angay.git)
    cd ANGAY
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your Supabase keys:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    *Open [http://localhost:5173](http://localhost:5173) to view the website.*

---
### $\Large {\text{Sample Credentials}}$
Use these test accounts to explore the different portal functionalities:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Foodbank Admin** | `adminfoodbank@gmail.com` | `passWord$1430` |
| **Barangay Rep** | `barangayrep@gmail.com` | `barangayRep*123` |
| **Individual Donor** | `donor_example@gmail.com` | `donor_passWord123` |
--- 

### $\Large {\text{Landing Page}}$
<p align="center">
  <a href="https://uupm.cc">
    <img src="/docs/screenshots/hero_page.png" alt="Hero Page" width="800">
  </a>
</p>


---