// this class allows to process queries before preparing a response via express and mongoose (подготавливает запрос для обработки в express и mongoose)
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // it allows to prepare the query string for filtering (позволяет подготовить запрос для 'фильтрации')
  filter() {
    // 1A. Filtering
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B. Advanced Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  // it allows to sort the results according to the entered parameter (позволяет отсортировать запрос по определенному параметру)
  sort() {
    // 2. Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  // it allows to limit the displayed fields in each search result (позволяет выбрать поля с данными, которые нужно отобразить)
  limitFields() {
    // 3. Field limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  // it allows to make the imaginary list of displayed search results not to exceed certain limit (позволяет ограничить количество отображаемых результатов)
  paginate() {
    // 4. Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
