const Category = require('../models/Category');
const slugify = require('slugify');

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ category });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, icon, order } = req.body;
    
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({
      name,
      slug: slugify(name.toLowerCase()),
      description,
      icon,
      order: order || 0
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category', error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { name, description, icon, order, isActive } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // If name is being updated, update slug as well
    const updateData = {
      name: name || category.name,
      description: description || category.description,
      icon: icon || category.icon,
      order: order !== undefined ? order : category.order,
      isActive: isActive !== undefined ? isActive : category.isActive
    };

    if (name) {
      updateData.slug = slugify(name.toLowerCase());
    }

    await category.update(updateData);

    res.json({
      message: 'Category updated successfully',
      category
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category', error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Soft delete by setting isActive to false
    await category.update({ isActive: false });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
};

exports.reorderCategories = async (req, res) => {
  try {
    const { orders } = req.body; // { categoryId: newOrder }

    // Update orders in transaction
    await sequelize.transaction(async (t) => {
      for (const [categoryId, order] of Object.entries(orders)) {
        await Category.update(
          { order },
          { where: { id: categoryId }, transaction: t }
        );
      }
    });

    const updatedCategories = await Category.findAll({
      order: [['order', 'ASC']]
    });

    res.json({
      message: 'Categories reordered successfully',
      categories: updatedCategories
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reorder categories', error: error.message });
  }
};
