const advancedResults = (model, populate) => async (request, response, next) => {
    let generated_query = { ...request.query };

    const remove_fields = [
        "search",
        "in_careers",
        "select",
        "sort",
        "page",
        "limit"
    ];

    remove_fields.forEach((param) => delete generated_query[param]);

    let stringed_query = JSON.stringify(generated_query);

    stringed_query = stringed_query.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    generated_query = JSON.parse(stringed_query);

    let aggregate_query = [];

    for (const query_key in generated_query) {
        const query_values = generated_query[query_key];

        if (!query_values.length) {
            for (const key in query_values) {
                const value = query_values[key]

                aggregate_query.push({
                    $match: {
                        [query_key]: {
                            [key]: JSON.parse(value)
                        }
                    }
                })
            }
        } else {
            aggregate_query.push(
                {
                    $match: {
                        [query_key]: JSON.parse(query_values)
                    }
                }
            )
        }
    }

    if (request.query.in_careers) {
        JSON.parse(request.query.in_careers).forEach(item => {
            aggregate_query.push({
                $match: {
                    careers: {
                        $in: [`${item}`]
                    },
                },
            });
        });
    };

    if (request.query.search) {
        aggregate_query.push({
            $match: {
                $or: [
                    {
                        name: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        description: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        website: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        phone: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        email: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        'location.formattedAddress': {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        careers: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        averageCost: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        tuition: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        title: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        minimumSkill: {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        'bootcamp.name': {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                    {
                        'bootcamp.description': {
                            $regex: request.query.search,
                            $options: "i",
                        },
                    },
                ],
            },
        });
    };


    if (request.query.select) {
        const fields = request.query.select.split(',');

        let fields_query = {};

        for (const field of fields) {
            fields_query[field] = 1
        };
        aggregate_query.push({
            $project: fields_query
        });
    };

    if (request.query.sort) {
        const field = request.query.sort.split(',')[1];

        let fields_query = {};

        if (request.query.sort.split(',')[0] === 'a') {
            fields_query[field] = 1
        } else if (request.query.sort.split(',')[0] === 'd') {
            fields_query[field] = -1
        } else {
            fields_query['created_at'] = -1
        }


        aggregate_query.push({
            $sort: fields_query
        });
    };

    let pagination = {};

    const page = parseInt(request.query.page, 10) || 1;
    const limit = parseInt(request.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments();

    
    aggregate_query.push(
        {
            $skip: startIndex
        },
        {
            $limit: limit
        }
    );

    if (endIndex < total) {
        pagination.next = {
            page: page + 1,
            limit
        };
    };

    if (startIndex > 0) {
        pagination.previous = {
            page: page - 1,
            limit
        };
    };

    if (!aggregate_query || !aggregate_query.length) {
        aggregate_query.push({
            $match: {}
        });
    };

    if (populate) {
        if (populate = 'courses') {
            aggregate_query.push(
                {
                    $lookup: {
                        from: 'courses',
                        localField: '_id',
                        foreignField: 'bootcamp',
                        as: 'courses'
                    }
                }
            )
        }
        if (populate = 'bootcamps') {
            aggregate_query.push(
                {
                    $lookup: {
                        from: 'bootcamps',
                        localField: 'bootcamp',
                        foreignField: '_id',
                        as: 'bootcamp'
                    }
                }
                )
            }
        }
        

    await model
        .aggregate(aggregate_query)
        .then(data => {
            response
                .status(200)
                .json({
                    success: true,
                    count: data.length,
                    pagination: pagination,
                    data: data
                });
        })
        .catch(error => {
            next(error);
        });


}

module.exports = advancedResults;