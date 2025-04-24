const transformRestaurantData = (newData, bootstrapData) => {
    const { restaurant, menu } = newData || {};

    // Early return if critical data is missing
    if (!restaurant) {
        return null;
    }

    // Create a map of dietary types for efficient lookup
    const dietaryMap = {};
    bootstrapData?.dietaryOptions?.forEach(option => {
        // Map display name to enum value (e.g., "Veg" -> "VEG")
        dietaryMap[option.displayName] = option.enumVal;
    });

    // Handle null menu case
    if (!menu) {
        return {
            ...restaurant,
            categories: [],
            options: [],
            addons: []
        };
    }

    // Transform options into the old format
    const transformedOptions = menu.food
        .map(food => ({
            _id: food._id,
            title: food.name,
            description: food.description || "",
            price: food.variationList[0]?.price || 0
        }));

    // Transform addons into the old format
    const transformedAddons = menu.optionSetList.map(optionSet => ({
        _id: optionSet._id,
        title: optionSet.title,
        description: optionSet.title,
        quantityMinimum: optionSet.minQty,
        quantityMaximum: optionSet.maxQty,
        options: optionSet.optionData.map(option => ({
            _id: option.foodId,
            optionId: option._id,
        }))
    }));

    // Create an addon map for quick lookup
    const addonMap = new Map(menu.optionSetList.map(optionSet => [optionSet._id, optionSet]));

    // Transform categories and foods into the old format
    const transformedCategories = menu.categoryData.map(category => {
        const categoryFoods = category.foodList.map(foodId => {
            const food = menu.food.find(f => (f._id === foodId && !f.hiddenFromMenu));
            if (!food) return null;
            return {
                _id: food._id,
                title: food.name,
                description: food.description || "",
                tags: food.tags,
                dietaryType: dietaryMap[food.dietaryType[0]] || food.dietaryType[0],
                variations: food.variationList.map(variation => {
                    // Find corresponding optionSets for this variation
                    const addonIds = variation.optionSetList || [];
                    const mappedAddons = addonIds.map(optionSetId => {
                        const optionSet = addonMap.get(optionSetId);
                        if (!optionSet) return null;
                        return optionSetId;
                    }).filter(Boolean);

                    return {
                        _id: variation._id,
                        title: variation.title,
                        price: variation.price,
                        discounted: variation.discountedPrice,
                        addons: mappedAddons // Now includes mapped addons
                    };
                }),
                image: food.imageData.images?.find(image => image.type === "MAIN")?.url,
                isActive: food.active,
                outOfStock: food.outOfStock,
                allergen: food.allergen
            };
        }).filter(Boolean);

        return {
            _id: category._id,
            title: category.name,
            foods: categoryFoods,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt
        };
    });

    // Combine everything into the final structure
    return {
        ...restaurant,
        categories: transformedCategories,
        options: transformedOptions,
        addons: transformedAddons
    };
};

export default transformRestaurantData;