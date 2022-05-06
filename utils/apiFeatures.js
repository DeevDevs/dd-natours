class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A. Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B. Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this; //I return the entire object, from where the next method is executed (with all the variables already mutated)
  }

  sort() {
    // 2. Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this; //I return the entire object, from where the next method is executed (with all the variables already mutated)
  }

  limitFields() {
    // 3. Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this; //I return the entire object, from where the next method is executed (with all the variables already mutated)
  }

  paginate() {
    // 4. Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this; //I return the entire object, from where the this.query object is going to be extracted to form response
  }
}

module.exports = APIFeatures;
