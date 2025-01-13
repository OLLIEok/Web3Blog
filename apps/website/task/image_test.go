package task_test

import (
	"blog/task"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestImageTask(t *testing.T) {
	err := task.NewImageCronTask()()
	assert.Equal(t, nil, err, err)
}
