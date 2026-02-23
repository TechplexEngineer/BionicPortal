

function test2() {
  allInOne({
    name: "Aarush Srinivasan",
    email: "aarushsrinivasan@billericak12.com",
    event: "Waterbury District Event",
    cost: "150"
  })
}

function allInOne({name, email, event, cost}) {
  const customerName = name;
  const customerEmail = email;

  //1. find customer by name or create them if missing
  const customer = findCustomerByEmail(customerEmail) || findCustomerByName(customerName) || createCustomer(customerName, customerEmail)
  console.log("Customer:", customer.DisplayName)
  // console.log(JSON.stringify(customer, null, 2))

  //2. find item by name
  const item = findItemByName(event) || createItemWithAccountName(event, "", "Program Service Revenue (L2):District Events Income")
  console.log("Item:", item.FullyQualifiedName)
  // console.log(JSON.stringify(item, null, 2))

  //3. create invoice for customer
  const invoice = createInvoice(customer.Id, [
    {
      Amount: cost,
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: item.Id } 
      },
      Description: "Competition Fee",
    }
  ])
  console.log("Created Invoice: ", JSON.stringify(invoice, null, 2))
  // console.log("Created Invoice: ", invoice.DocNumber)
}


function test() {
  const customerName = "Blake Bourque"; //"Diego Rodriguez";
  const customerEmail = "bbourque@billericak12.com";

  //1. find customer by name or create them if missing
  const customer = findCustomerByEmail(customerEmail) || findCustomerByName(customerName) || createCustomer(customerName, customerEmail)
  console.log("Found Customer:", customer.DisplayName)
  // console.log(JSON.stringify(customer, null, 2))

  //2. find item by name
  const item = findItemByName("UVM District Event") || createItemWithAccountName("UVM District Event", "", "Program Service Revenue (L2):District Events Income")
  console.log("Found Item:", item.FullyQualifiedName)
  // console.log(JSON.stringify(item, null, 2))

  //3. create invoice for customer
  const invoice = createInvoice(customer.Id, [
    {
      Amount: "200",
      DetailType: "SalesItemLineDetail",
      SalesItemLineDetail: {
        ItemRef: { value: item.Id } 
      },
      Description: "Competition Fee",
    }
  ])
  console.log("Created Invoice: ", JSON.stringify(invoice, null, 2))
  // console.log("Created Invoice: ", invoice.DocNumber)

}

function findCustomerByName(name) {
  console.log("findCustomerByName(",name,")")
  const query = `SELECT * FROM Customer WHERE DisplayName = '${name}'`;
  const encoded = encodeURIComponent(query);

  const response = request(`/query?query=${encoded}`);
  const customers = response?.QueryResponse?.Customer || [];

  return customers.length ? customers[0] : null;
}

function findCustomerByEmail(email) {
  console.log("findCustomerByEmail(", email,")")
  const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`;
  const encoded = encodeURIComponent(query);

  const response = request(`/query?query=${encoded}`);
  const customers = response?.QueryResponse?.Customer || [];

  return customers.length ? customers[0] : null;
}


function createInvoice(customerId, items) {
  const body = {
    CustomerRef: { value: customerId },
    Line: items,

    // 🔥 turn on online payments
    AllowOnlinePayment: true,
    AllowOnlineCreditCardPayment: true,
    AllowOnlineACHPayment: true,

    PaymentMethodRef: { "value": "CreditCard" }
  };

  return POSTrequest("/invoice?minorversion=75", body);
}

function findItemByName(name) {
  const query = `SELECT * FROM Item WHERE Name = '${name}'`;
  const encoded = encodeURIComponent(query);

  const response = request(`/query?query=${encoded}`);
  const items = response?.QueryResponse?.Item || [];

  return items.length ? items[0] : null;
}

function createCustomer(name, email) {
  console.log("createCustomer(",email,")")
  const body = {
    DisplayName: name,
    PrimaryEmailAddr: email ? { Address: email } : undefined
  };

  return POSTrequest("/customer?minorversion=75", body);
}

function createItem(name, description, incomeAccountId) {
  const body = {
    Name: name,
    Description: description,
    Active: true,
    Type: "Service",
    IncomeAccountRef: {
      value: incomeAccountId,  // e.g. "79"
    }
  };

  return POSTrequest("/item?minorversion=75", body);
}

/**
 * incomeAccountFullName {string} eg. "Program Service Revenue (L2):District Events Income"
 */
function createItemWithAccountName(name, description, incomeAccountFullName) {
  const account = findIncomeAccountByName(incomeAccountFullName)

  return createItem(name, description, account.Id)
}

function findIncomeAccountByName(name) {
  const query = `SELECT * FROM Account WHERE AccountType = 'Income' AND FullyQualifiedName = '${name}'`;
  const encoded = encodeURIComponent(query);

  const response = request(`/query?query=${encoded}`);
  const accounts = response?.QueryResponse?.Account || [];

  return accounts.length ? accounts[0] : null;
}







