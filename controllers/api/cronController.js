const PropertyTask = require("../../models/propertyTask")
const CategoryCheckList = require("../../models/CategoryCheckList")
const Form = require("../../models/Form")

exports.formCron = async(req, res) => {
  try {
    console.log('cron running')
    const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
    const date = new Date();
    const propertyTask = await PropertyTask.find()
    for (let task of propertyTask) {
      const managers = []
      const supervisors = task.superviserId
      const categoryCheckList = await CategoryCheckList.find({category_id: task.categoryId})
      for (let category of categoryCheckList) {
        if (category.frequency === 'monthly') {
          if (date.getDate()+1 == category.date) {
            console.log('monthly')
            if (managers.length > 0) {
              for (let manager of managers) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: manager,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: manager})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }
            if (supervisors.length > 0) {
              for (let supervisor of supervisors) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: supervisor,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: supervisor})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }
          }
        } else if (category.frequency === 'quarterly') {
          if (date.getMonth()+1 == category.month && date.getDate()+1 == category.date) {
            console.log('quarterly')
            if (managers.length > 0) {
              for (let manager of managers) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: manager,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: manager})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }
        
            if (supervisors.length > 0) {
              for (let supervisor of supervisors) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: supervisor,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: supervisor})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }  
          }
        } else if (category.frequency === 'annually') {
          if (date.getMonth()+1 == category.month && date.getDate()+1 == category.date) {
            console.log('annually') 
            if (managers.length > 0) {
              for (let manager of managers) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: manager,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: manager})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }
        
            if (supervisors.length > 0) {
              for (let supervisor of supervisors) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: supervisor,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: supervisor})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            } 
          }
        } else if (category.frequency === 'bi-annually') {
          if (date.getMonth()+1 == category.month && date.getDate()+1 == category.date) {
            console.log('bi-annually')
            if (managers.length > 0) {
              for (let manager of managers) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: manager,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: manager})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }
        
            if (supervisors.length > 0) {
              for (let supervisor of supervisors) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: supervisor,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: supervisor})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }  
          }
        } else if (category.frequency === 'weekly') {
          if (days[date.getDay()] == category.day) {
            console.log('weekly')
            if (managers.length > 0) {
              for (let manager of managers) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: manager,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: manager})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }
        
            if (supervisors.length > 0) {
              for (let supervisor of supervisors) {
                const obj = {
                  categoryChecklistId: category._id,
                  categoryId: category.category_id,
                  userId: supervisor,
                  status: 0,
                  completeDate: null,
                  form: category.form,
                  percentage: 0
                }
                if (category.type === 'register') {
                  const data = await Form.findOne({category_id: category.category_id, userId: supervisor})
                  if(!data) {
                    await Form.create(obj)    
                  } 
                else {
                    await Form.create(obj)
                  }
                }
              }
            }  
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}